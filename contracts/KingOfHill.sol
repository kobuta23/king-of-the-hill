// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {SuperAppBaseFlow} from "./SuperAppBaseFlow.sol";

import { IERC1820Registry } from "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";
import { IERC777Recipient } from "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";

import "hardhat/console.sol";

/// @title KingOfTheHill
/// @author Perthi
contract KingOfHill is SuperAppBaseFlow, IERC777Recipient {

    // ---------------------------------------------------------------------------------------------
    // EVENTS
    event HailNewKing(address king, uint256 army);

    /// @notice Importing the SuperToken Library to make working with streams easy.
    using SuperTokenV1Library for ISuperToken;
    // ---------------------------------------------------------------------------------------------
    // STORAGE & IMMUTABLES

    /// @notice Constant used for ERC777.

    IERC1820Registry constant internal _ERC1820_REG = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    /// @notice Token coming in and token going out
    ISuperToken public immutable cashToken;
    ISuperToken public immutable armyToken;

    /// @notice the last time the rate changed
    uint256 immutable initialTime;
    int96 immutable initialRate;

    /// @notice the amount of tax which remains in the contract as trasure
    int96 public immutable treasureRate;

    /// @notice the rate of decay of the exchange rate, expressed in wei/second.
    int96 public decay;

    /// @notice the step in the army auction. How much bigger than previous should it be?
    uint256 public step;

    /// @notice the current king of the hill
    address public king;
    uint256 public army;

    constructor(
        ISuperToken _cashToken,
        ISuperToken _armyToken,
        int96 _decay,
        uint256 _step
    ) SuperAppBaseFlow(
        ISuperfluid(_cashToken.getHost()), 
        true, 
        true, 
        true
    ) {
        require(_decay >= 0, "decay must be positive");
        armyToken = _armyToken;
        cashToken = _cashToken;
        initialRate = 1e18;
        step = _step;
        decay = _decay;
        initialTime = block.timestamp;
        king = msg.sender;
        treasureRate = 1000; // 10% treasure fee

        bytes32 erc777TokensRecipientHash = keccak256("ERC777TokensRecipient");
        _ERC1820_REG.setInterfaceImplementer(address(this), erc777TokensRecipientHash, address(this));

        _acceptedSuperTokens[_cashToken] = true;
    }

    // ---------------------------------------------------------------------------------------------
    // UTILITY FUNCTIONS
    // ---------------------------------------------------------------------------------------------

    function taxRate() public view returns (int96){
        return cashToken.getFlowRate(address(this), king);
    }

    function _rate() internal view returns (int96){
        return initialRate - int96(int256(block.timestamp - initialTime)) * decay;
    }

    function rate() public view returns (int96) {
        return _rate();
    }

    function rate(address user) public view returns (int96) {
        return armyToken.getFlowRate(address(this), user) / cashToken.getFlowRate(user, address(this));
    }

    function armyFlowRate(int96 cashFlowRate) public view returns (int96) {
        return cashFlowRate * _rate() / 1e18;
    }

    function _totalTaxMinusFee() internal view returns (int96){
        int96 totalInflow = cashToken.getNetFlowRate(address(this)) + cashToken.getFlowRate(address(this), king);
        return totalInflow - (totalInflow * treasureRate / 10000); // treasureRate defines the amount kept in contract
    }

    // ---------------------------------------------------------------------------------------------
    // BECOMING KING
    // ---------------------------------------------------------------------------------------------

    // IERC777Recipient
    function tokensReceived(
        address /*operator*/,
        address from,
        address /*to*/,
        uint256 amount,
        bytes calldata /*userData*/,
        bytes calldata /*operatorData*/
    ) override external {
        // if it's not a SuperToken, something will revert along the way
        require(ISuperToken(msg.sender) == armyToken, "Please send the right token!");
        _claim(from, amount);
    }

    function claim(uint256 amount) public{
        armyToken.transferFrom(msg.sender, address(this), amount);
        _claim(msg.sender, amount);
    }

    function _claim(address newKing, uint256 newArmy) internal {
        // user sends army to the hill (armyToken)
        // if their army is bigger they become king
        // claim treasure and ongoing taxes
        require(newArmy > (army + step), "send bigger army");
        // set new army to protect hill
        army = newArmy;
        // replace the king
        int96 cashOutflow = cashToken.getFlowRate(address(this), king);
        if(cashOutflow > 0) {
            cashToken.deleteFlow(address(this), king);
            cashToken.createFlow(newKing, cashOutflow);
        }
        // send newKing the treasure
        cashToken.transfer(newKing, cashToken.balanceOf(address(this)));
        // crown new king
        king = newKing;
        emit HailNewKing(king, newArmy);
    }

    // ---------------------------------------------------------------------------------------------
    // SUPER APP CALLBACKS
    // ---------------------------------------------------------------------------------------------

    /// @dev super app callback triggered after user sends stream to contract
    function afterFlowCreated(
        ISuperToken superToken,
        address sender,
        bytes calldata /*beforeData*/,
        bytes calldata ctx
    ) internal override returns (bytes memory newCtx) {
        // user is streaming in cashToken, send him back armyToken
        newCtx = armyToken.createFlowWithCtx(sender, armyFlowRate(cashToken.getFlowRate(sender,address(this))), ctx);
        // adjust (up) stream to king
        cashToken.getFlowRate(address(this), king) == 0
            ? newCtx = cashToken.createFlowWithCtx(king, _totalTaxMinusFee(), newCtx)
            : newCtx = cashToken.updateFlowWithCtx(king, _totalTaxMinusFee(), newCtx);
    }

    function afterFlowUpdated(
        ISuperToken /*superToken*/,
        address /*sender*/,
        bytes calldata /*beforeData*/,
        bytes calldata /*ctx*/
    ) internal override returns (bytes memory /*newCtx*/) {
        revert("can't update sorry bye");
    }

    function afterFlowDeleted(
        ISuperToken /*superToken*/,
        address sender,
        address /*receiver*/,
        bytes calldata /*beforeData*/,
        bytes calldata ctx
    ) internal override returns (bytes memory newCtx) {
        // user stopped streaming in cashToken, close the armyToken stream
        newCtx = armyToken.deleteFlowWithCtx(address(this), sender, ctx);
        // adjust (down) stream to king
        int96 _taxRate = _totalTaxMinusFee();
        _taxRate == 0
            ? newCtx = cashToken.deleteFlowWithCtx(address(this), king, newCtx)
            : newCtx = cashToken.updateFlowWithCtx(king, _taxRate, newCtx);
    }
}
