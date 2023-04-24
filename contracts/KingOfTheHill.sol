// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBaseFlow} from "./SuperAppBaseFlow.sol";
import { IArmyUnits } from "./interfaces/IArmyUnits.sol";
import "hardhat/console.sol";

contract KingOfTheHill is SuperAppBaseFlow {

    // ---------------------------------------------------------------------------------------------
    // EVENTS
    event HailNewKing(address king, uint256 army);
    event BuildingArmy(address account, int96 armyFlowRate);

    /// @notice Importing the SuperToken Library to make working with streams easy.
    using SuperTokenV1Library for ISuperToken;
    // ---------------------------------------------------------------------------------------------
    // STORAGE & IMMUTABLES

    /// @notice Token coming in and token going out
    ISuperToken public immutable cashToken;
    ISuperToken public immutable armyToken;

    /// @notice the last time the rate changed
    uint256 immutable initialTime;
    int96 immutable initialRate;

    /// @notice the amount of tax which remains in the contract as treasure
    int96 public immutable treasureRate;

    /// @notice the step in the army auction. How much bigger than previous should it be?
    uint256 public step;

    /// @notice the current king of the hill
    address public king;
    uint256 public army;

    // army units contract
    IArmyUnits public immutable armyUnitsContract;

    constructor(
        ISuperToken _cashToken,
        ISuperToken _armyToken,
        uint256 _step,
        IArmyUnits _armyUnitsContract
    ) SuperAppBaseFlow(
        ISuperfluid(_cashToken.getHost()), 
        true, 
        true, 
        true
    ) {
        // TODO: add checks for _cashToken, _armyToken, _armyUnitsContract

        armyToken = _armyToken;
        cashToken = _cashToken;
        initialRate = 1e18;
        step = _step;
        initialTime = block.timestamp;
        king = msg.sender;
        treasureRate = 1000; // 10% treasure fee
        armyUnitsContract = _armyUnitsContract;

        _acceptedSuperTokens[_cashToken] = true;
    }

    // ---------------------------------------------------------------------------------------------
    // UTILITY FUNCTIONS
    // ---------------------------------------------------------------------------------------------

    function taxRate() public view returns (int96){
        return cashToken.getFlowRate(address(this), king);
    }

    //TODO: review
    function _rate() internal view returns (int96) {
        int96 calculatedRate = initialRate - int96(int256(block.timestamp - initialTime));
        return calculatedRate < 0 ? int96(0) : calculatedRate;
    }

    function rate() public view returns (int96) {
        return _rate();
    }

    function rate(address user) public view returns (int96) {
        return armyToken.getFlowRate(address(this), user) / cashToken.getFlowRate(user, address(this));
    }

    function _armyFlowRate(int96 cashFlowRate) internal view returns (int96) {
        uint256 _cashFlowRate = uint96(cashFlowRate);
        uint256 _rate = uint96(_rate());
        uint256 armyFlowRate = uint256(_cashFlowRate * _rate) / 1e18;
        require(armyFlowRate <= uint256(uint96(type(int96).max)), "armyFlowRate overflow");
        return int96(int256(armyFlowRate));
    }

    function armyFlowRate(int96 cashFlowRate) public view returns (int96) {
        return _armyFlowRate(cashFlowRate);
    }

    //TODO: review
    function _totalTaxMinusFee() internal view returns (int96){
        int96 totalInflow = cashToken.getNetFlowRate(address(this)) + cashToken.getFlowRate(address(this), king);
        return totalInflow - (totalInflow * treasureRate / 10000); // treasureRate defines the amount kept in contract
    }

    // ---------------------------------------------------------------------------------------------
    // BECOMING KING
    // ---------------------------------------------------------------------------------------------

    function claim(uint256 amount) public{
        armyToken.transferFrom(msg.sender, address(this), amount);
        _claim(msg.sender, amount);
    }

    function _claim(address newKing, uint256 newArmy) internal {
        // user sends army to the hill (armyToken)
        // if their army is bigger they become king
        // claim treasure and ongoing taxes
        require(newArmy >= (army + step), "send bigger army");
        // set new army to protect hill
        army = newArmy;
        // replace the king
        int96 cashOutflow = cashToken.getFlowRate(address(this), king);
        if(cashOutflow > 0) {
            cashToken.deleteFlow(address(this), king);
            //cashToken.createFlow(newKing, cashOutflow);
        }
        cashOutflow = _totalTaxMinusFee();
        if(cashOutflow > 0) {
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
        newCtx = ctx;
        // user is streaming in cashToken, send him back armyToken.
        // if _armyFlowRate returns zero we want to revert the operation.
        int96 armyFlowRate = _armyFlowRate(superToken.getFlowRate(sender, address(this)));
        newCtx = armyToken.createFlowWithCtx(sender, armyFlowRate, ctx);
        // adjust (up) stream to king
        cashToken.getFlowRate(address(this), king) == 0
            ? newCtx = cashToken.createFlowWithCtx(king, _totalTaxMinusFee(), newCtx)
            : newCtx = cashToken.updateFlowWithCtx(king, _totalTaxMinusFee(), newCtx);
        emit BuildingArmy(sender, armyFlowRate);
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
        newCtx = ctx;
        // user stopped streaming in cashToken, close the armyToken stream if running
        if(armyToken.getFlowRate(address(this), sender) != 0) {
            newCtx = armyToken.deleteFlowWithCtx(address(this), sender, newCtx);
        }
        // only operate on stream if they are running
        if(cashToken.getFlowRate(address(this), king) != 0) {
            // adjust (down) stream to king
            int96 _taxRate = _totalTaxMinusFee();
            _taxRate == 0
                ? newCtx = cashToken.deleteFlowWithCtx(address(this), king, newCtx)
                : newCtx = cashToken.updateFlowWithCtx(king, _taxRate, newCtx);
        }
    }
}
