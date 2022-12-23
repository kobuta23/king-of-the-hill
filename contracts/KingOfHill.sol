// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import "hardhat/console.sol";

/// @title KingOfTheHill
/// @author Perthi
contract KingOfHill is SuperAppBase {

    /// @notice Importing the SuperToken Library to make working with streams easy.
    using SuperTokenV1Library for ISuperToken;
    // ---------------------------------------------------------------------------------------------
    // STORAGE & IMMUTABLES

    /// @notice Constant used for initialization of CFAv1 and for callback modifiers.
    bytes32 public constant CFA_ID =
        keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");

    /// @notice Superfluid Host.
    ISuperfluid public immutable host;

    /// @notice Token coming in.
    ISuperToken public immutable cashToken;

    /// @notice Token coming in.
    ISuperToken public immutable gameToken;

    /// @notice the current price of gameToken, expressed in cashTokens.

    /// @notice the last time the rate changed
    uint256 immutable initialTime;
    int96 immutable initialRate;

    /// @notice the rate of decay of the exchange rate, expressed in wei/second.
    int96 public decay;

    /// @notice the current king of the hill
    address public king;

    // ---------------------------------------------------------------------------------------------
    //MODIFIERS

    /// @dev checks that only the CFA is being used
    ///@param agreementClass the address of the agreement which triggers callback
    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType() == CFA_ID;
    }

    ///@dev checks that only the cashToken is used when sending streams into this contract
    ///@param superToken the token being streamed into the contract
    function _isAcceptedToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(cashToken) || address(superToken) == address(gameToken);
    }

    ///@dev ensures that only the host can call functions where this is implemented
    //for usage in callbacks only
    modifier onlyHost() {
        require(msg.sender == address(host), "Only host can call callback");
        _;
    }

    ///@dev used to implement _isAcceptedToken and _isCFAv1 modifiers
    ///@param superToken used when sending streams into contract to trigger callbacks
    ///@param agreementClass the address of the agreement which triggers callback
    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isAcceptedToken(superToken), "RedirectAll: not accepted token");
        require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
        _;
    }

    constructor(
        ISuperToken _cashToken, // super token to be used in borrowing
        ISuperToken _gameToken, // super token to be used in borrowing
        int96 _decay
    ) {
        gameToken = _gameToken;
        cashToken = _cashToken;
        host = ISuperfluid(_cashToken.getHost());
        initialRate = 1e18;
        decay = _decay;
        initialTime = block.timestamp;
        king = msg.sender;

        // super app registration
        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        // Using host.registerApp because we are using testnet. If you would like to deploy to
        // mainnet, this process will work differently. You'll need to use registerAppWithKey or
        // registerAppByFactory.
        // https://github.com/superfluid-finance/protocol-monorepo/wiki/Super-App-White-listing-Guide
        host.registerApp(configWord);
    }

    function rate(int96 cashFlowRate) public returns (int96) {
        return cashFlowRate * (initialRate - int96(int256(block.timestamp - initialTime)) * decay) / 1e18;
    }

    function _totalTaxMinusFee() internal view returns (int96){
        int96 totalInflow = cashToken.getNetFlowRate(address(this)) + cashToken.getFlowRate(address(this), king);
        return totalInflow * 90 / 100; // hardcoding 10% treasure collection
    }

    // ---------------------------------------------------------------------------------------------
    // FUNCTIONS & CORE LOGIC



    // ---------------------------------------------------------------------------------------------
    // SUPER APP CALLBACKS

    /// @dev super app after agreement created callback
    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        newCtx = ctx;
        (address sender, ) = abi.decode(_agreementData, (address, address));
        if(_superToken == cashToken){
            // user is streaming in cashToken, send him back Game
            newCtx = gameToken.createFlowWithCtx(sender, rate(cashToken.getFlowRate(sender,address(this))), newCtx);
            // update stream to king
            if(cashToken.getFlowRate(address(this), king) == 0){
                newCtx = cashToken.createFlowWithCtx(king, _totalTaxMinusFee(), newCtx);
            } else {
                newCtx = cashToken.updateFlowWithCtx(king, _totalTaxMinusFee(), newCtx);
            }
        } else {
            // user is streaming in gameToken, check if they're streaming more than previous user
            // if they are, send him the treasure
            // then redirect the taxes to them 
            require(gameToken.getFlowRate(sender, address(this)) > gameToken.getFlowRate(king, address(this)), "send more you pleb");
            if(gameToken.getFlowRate(king, address(this)) > 0)
                newCtx = gameToken.deleteFlowWithCtx(king, address(this), newCtx);
            int96 cashOutflow = cashToken.getFlowRate(address(this), king);
            newCtx = cashToken.deleteFlowWithCtx(address(this), king, newCtx);
            // now create the cashOutflow for the new king
            newCtx = cashToken.createFlowWithCtx(sender, cashOutflow, newCtx);
            // send them the treasure
            cashToken.transfer(sender, cashToken.balanceOf(address(this)));
            // and crown him
            king = sender;
        }
    }

    /// @dev super app after agreement updated callback
    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, /*_agreementData*/
        bytes calldata, // _cbdata,
        bytes calldata //ctx
    )
        external
        view
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory)
    {
        revert("can't update sorry bye");
    }

    /// @dev super app after agreement terminated callback
    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        if (!_isCFAv1(_agreementClass) || !_isAcceptedToken(_superToken)) {
            return ctx;
        }
        newCtx = ctx;
        (address sender, ) = abi.decode(_agreementData, (address, address));
        if(_superToken == cashToken){
            // user stopped streaming in cashToken, close the gameToken stream
            newCtx = gameToken.deleteFlowWithCtx(address(this), sender, newCtx);
            // adjust (down) stream to king
            int96 taxRate = _totalTaxMinusFee();
            taxRate == 0
                ? newCtx = cashToken.deleteFlowWithCtx(address(this), king, newCtx)
                : newCtx = cashToken.updateFlowWithCtx(king, taxRate, newCtx);
        } else {
            // king stopped streaming in gameTokens. Stop sending them cashToken
            newCtx = cashToken.deleteFlowWithCtx(address(this), king, newCtx);
            // and remove their crown
            king = address(0);
        }
    }
}
