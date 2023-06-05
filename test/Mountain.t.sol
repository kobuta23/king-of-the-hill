// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import { Mountain } from "./../src/Mountain.sol";
import { TokenResources } from "./../src/tokens/TokenResources.sol";

import {
SuperfluidFrameworkDeployer, ISuperToken, ISuperfluid
} from "@superfluid-finance/ethereum-contracts/contracts/utils/SuperfluidFrameworkDeployer.sol";

import {
SuperTokenDeployer, TestToken, SuperToken
} from "@superfluid-finance/ethereum-contracts/contracts/utils/SuperTokenDeployer.sol";
import { ISuperApp } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperApp.sol";
import { IPureSuperToken } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/IPureSuperToken.sol";
import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import { ERC1820RegistryCompiled } from "@superfluid-finance/ethereum-contracts/contracts/libs/ERC1820RegistryCompiled.sol";

contract MountainTest is Test {

	using SuperTokenV1Library for IPureSuperToken;

	uint256 constant INT256_MAX_AS_UINT256 = uint256(type(int256).max);

	address public owner = address(0x01);
	address public feeCollector = address(0x02);

	address public player1 = address(0x11);
	address public player2 = address(0x12);
	address public player3 = address(0x13);
	address public player4 = address(0x14);

	Mountain public mountain;

	SuperfluidFrameworkDeployer public sfDeployer;
	SuperfluidFrameworkDeployer.Framework public sf;
    SuperTokenDeployer tokenDeployer;

	IPureSuperToken public streamInToken;
	IPureSuperToken public streamOutToken;
	TokenResources public tokenResources;

	function setUp() public virtual {
		vm.etch(ERC1820RegistryCompiled.at, ERC1820RegistryCompiled.bin);
		// get UINT256_MAX
		vm.startPrank(owner);
		//mountain = new Mountain();

		sfDeployer = new SuperfluidFrameworkDeployer();
		sf = sfDeployer.getFramework();

		tokenDeployer = new SuperTokenDeployer(address(sf.superTokenFactory), address(sf.resolver));
		sf.resolver.addAdmin(address(tokenDeployer));
		// create a new super token
		streamInToken = tokenDeployer.deployPureSuperToken("TokenIn", "IN", INT256_MAX_AS_UINT256);
		streamOutToken = tokenDeployer.deployPureSuperToken("TokenOut", "OUT", INT256_MAX_AS_UINT256);

		// create 1 ArmyUnitType in a array
		TokenResources.ArmyUnitType[] memory armyUnitTypes = new TokenResources.ArmyUnitType[](1);
		armyUnitTypes[0] = TokenResources.ArmyUnitType({
			stoneToArmyExchangeRate: uint16(1),
			stoneTokenAddress: address(streamOutToken),
			attackPowerUnit: uint32(10),
			defensePowerUnit: uint32(100)
		});

		tokenResources = new TokenResources(owner, armyUnitTypes);
		// deploy mountain
		mountain = new Mountain(
			streamInToken,
			streamOutToken,
			1 ether,
			3 ether,
			0,//86400,
			feeCollector,
			tokenResources
		);

		// transfer streamOutToken to mountain
		streamOutToken.transfer(address(mountain), INT256_MAX_AS_UINT256 / 10);

	}

	// HELPERS

	function __checkIfNotJailed() private {
		assertEq(sf.host.isAppJailed(ISuperApp(mountain)), false, "mountain is jailed");
	}

	function __checkStreams(address sender, int96 flowRate) private {
		// check if sender is streaming to mountain
		(, int96 inFlowRate , , ) = streamInToken.getFlowInfo(sender, address(mountain));
		assertEq(inFlowRate, flowRate, "wrong inFlowRate");
		int96 stoneFlowRate = mountain.stoneFlowRate(sender);
		// check if mountain is streaming to sender
		(, int96 outFlowRate , , ) = streamOutToken.getFlowInfo(address(mountain), sender);
		assertEq(outFlowRate, stoneFlowRate, "wrong outFlowRate");
	}

	function __checkNetFlowRateMountain(int96 netFlowRate) private {
		// all streams to mountain should add up
		//int96 flowRate = streamInToken.getNetFlowRate(address(mountain));

		//int96 taxRate = mountain.taxRate();
		//assertEq(flowRate + taxRate, netFlowRate, "wrong flowRate");
	}

	function __fundAndOpenStreamToMountain(address sender, int96 flowRate) private {
		__fundPlayer(sender, 10000000 ether);

		// check if sender has tokens
		uint256 balance = streamInToken.balanceOf(sender);
		assertEq(balance, 10000000 ether, "wrong balance");

		vm.startPrank(sender);
		bytes memory userData = abi.encode(address(mountain));
		streamInToken.createFlow(address(mountain), flowRate, userData);
		vm.stopPrank();
		__checkStreams(sender, flowRate);
		__checkIfNotJailed();
	}

	function __fundPlayer(address player, uint256 amount) private {
		vm.startPrank(owner);
		// transfer tokens to sender
		streamInToken.transfer(player, amount);
		vm.stopPrank();
	}

	// TESTS

	function testInitialParameters() public {
		assertEq(address(mountain.streamInToken()), address(streamInToken), "wrong streamInToken");
		assertEq(address(mountain.streamOutToken()), address(streamOutToken), "wrong streamOutToken");
		assertEq(mountain.minFlowRate(), 1 ether, "wrong minFlowRate");
		assertEq(mountain.maxFlowRate(), 3 ether, "wrong maxFlowRate");
		assertEq(mountain.cooldownPeriodInSeconds(), 0, "wrong cooldownPeriodInSeconds");
		assertEq(mountain.feeCollector(), feeCollector, "wrong feeCollector");
		assertEq(mountain.king(), owner, "wrong initial king");
	}

	// check if streamInToken is allowed
	function testStreamInTokenApproved() public {
		assertEq(mountain.isAcceptedSuperToken(streamInToken), true, "wrong isAcceptedSuperToken");
	}

	function testIsSuperApp() public {
		assertEq(sf.host.isApp(ISuperApp(mountain)), true, "wrong isSuperApp");
		__checkIfNotJailed();
	}

	function testTaxCalculations() public {
		(int96 kingTax, int96 treasureTax, int96 feeTax) = mountain.splitAmounts(100 ether);
		assertEq(kingTax, 50 ether, "wrong king tax");
		assertEq(treasureTax, 30 ether, "wrong treasure tax");
		assertEq(feeTax, 20 ether, "wrong fee tax");
	}

	function testUpdateNotAllowed() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		vm.startPrank(player1);
		vm.expectRevert("Flow updated not supported");
		streamInToken.updateFlow(address(mountain), 2 ether);
		vm.stopPrank();
	}

	function testStopStream() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		vm.startPrank(player1);
		streamInToken.deleteFlow(player1, address(mountain));
		vm.stopPrank();
		int96 flowRate = streamInToken.getFlowRate(player1, address(mountain));
		assertEq(flowRate, 0, "stream should have been stopped");
		__checkIfNotJailed();
	}

	function testTaxRateAdjustmentOnStreamStop() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		int96 initialKingTaxRate = mountain.kingTaxRate();
		int96 initialFeeCollectorTaxRate = mountain.feeCollectorTaxRate();
		vm.startPrank(player1);
		streamInToken.deleteFlow(player1, address(mountain));
		vm.stopPrank();
		int96 newKingTaxRate = mountain.kingTaxRate();
		int96 newFeeCollectorTaxRate = mountain.feeCollectorTaxRate();
		assertLt(newKingTaxRate, initialKingTaxRate, "king tax rate should have decreased");
		assertLt(newFeeCollectorTaxRate, initialFeeCollectorTaxRate, "fee collector tax rate should have decreased");
		__checkIfNotJailed();
	}

	// TODO: fix
	function testFlowRateOutOfRange() public {
		/*
		__fundPlayer(player1, 100000 ether);
		vm.startPrank(player1);
		vm.expectRevert("Flow rate out of range");
		streamInToken.createFlow(address(mountain), 20 ether);
		vm.expectRevert("Flow rate out of range");
		streamInToken.createFlow(address(mountain), 0.1 ether);
		vm.stopPrank();
		*/
	}

	// TODO: fix
	function testCooldownPeriod() public {
		/*
		__fundAndOpenStreamToMountain(player1, 1 ether);
		vm.startPrank(player1);
		streamInToken.deleteFlow(player1, address(mountain));
		// try to open a new stream while in the cooldown period
		vm.expectRevert("User is in a cooldown period");
		streamInToken.createFlow(address(mountain), 1 ether);
		vm.stopPrank();
		*/
	}

	// TODO: fix
	function testNonAcceptedSuperToken() public {
		/*
		__fundPlayer(player1, 1 ether);
		vm.startPrank(owner);
		IPureSuperToken anotherSuperToken = tokenDeployer.deployPureSuperToken("notSupported", "NSUP", INT256_MAX_AS_UINT256);
		anotherSuperToken.transfer(player1, 10000 ether);
		vm.stopPrank();
		vm.startPrank(player1);
		vm.expectRevert();
		anotherSuperToken.createFlow(address(mountain), 1 ether);
		vm.stopPrank();
		*/
	}

	function testStreamToMountain() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		__fundAndOpenStreamToMountain(player2, 2 ether);
		__fundAndOpenStreamToMountain(player3, 3 ether);
		//__checkNetFlowRateMountain(6 ether);
		__checkIfNotJailed();
	}

	function testMultipleStreams() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		__fundAndOpenStreamToMountain(player2, 2 ether);
		__fundAndOpenStreamToMountain(player3, 3 ether);

		int96 outFlowRate1 = mountain.stoneFlowRate(player1);
		int96 outFlowRate2 = mountain.stoneFlowRate(player2);
		int96 outFlowRate3 = mountain.stoneFlowRate(player3);

		assertGt(outFlowRate1, 0, "Player 1 streamOutToken stream not created");
		assertGt(outFlowRate2, 0, "Player 2 streamOutToken stream not created");
		assertGt(outFlowRate3, 0, "Player 3 streamOutToken stream not created");

		(int96 kingTax1, , int96 feeTax1) = mountain.splitAmounts(outFlowRate1);
		(int96 kingTax2, , int96 feeTax2) = mountain.splitAmounts(outFlowRate2);
		(int96 kingTax3, , int96 feeTax3) = mountain.splitAmounts(outFlowRate3);

		int96 kingTax = mountain.kingTaxRate();
		int96 feeTax = mountain.feeCollectorTaxRate();

		assertEq(kingTax, kingTax1 + kingTax2 + kingTax3, "Wrong king tax rate");
		assertEq(feeTax, feeTax1 + feeTax2 + feeTax3, "Wrong fee collector tax rate");
	}


	function testUpdateStreamNotAllowed() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		vm.startPrank(player1);
		vm.expectRevert("Flow updated not supported");
		streamInToken.updateFlow(address(mountain), 2 ether);
		vm.stopPrank();
		__checkIfNotJailed();
	}


	function testStopStreamToMountain() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		vm.startPrank(player1);
		streamInToken.deleteFlow(player1, address(mountain));
		vm.stopPrank();
		__checkStreams(player1, 0);
		__checkIfNotJailed();
	}

	function testCreationOfStreamOutTokenStream() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		int96 outFlowRate = mountain.stoneFlowRate(player1);
		assertGt(outFlowRate, 0, "streamOutToken stream not created");
		__checkIfNotJailed();
	}

	function testDeletionOfStreamOutTokenStream() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		vm.startPrank(player1);
		streamInToken.deleteFlow(player1, address(mountain));
		int96 outFlowRate = mountain.stoneFlowRate(player1);
		assertEq(outFlowRate, 0, "streamOutToken stream not deleted");
		__checkIfNotJailed();
	}

	function testCalculationOfTaxes() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		int96 outFlowRate = mountain.stoneFlowRate(player1);
		(int96 kingTax, int96 treasureTax, int96 feeTax) = mountain.splitAmounts(outFlowRate);
		assertEq(kingTax, outFlowRate * 50 / 100, "wrong king tax");
		assertEq(feeTax, outFlowRate * 20 / 100, "wrong fee tax");
		assertEq(treasureTax, outFlowRate - kingTax - feeTax, "wrong treasure tax");
		__checkIfNotJailed();
	}

	function testUpdateOfSplitStreams() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		int96 kingTax = mountain.kingTaxRate();
		int96 feeTax = mountain.feeCollectorTaxRate();
		int96 outFlowRate = mountain.stoneFlowRate(player1);
		assertEq(kingTax, outFlowRate * 50 / 100, "wrong king tax rate");
		assertEq(feeTax, outFlowRate * 20 / 100, "wrong fee collector tax rate");
		__checkIfNotJailed();
	}

	function testKingStopsTaxStream() public {
		__fundAndOpenStreamToMountain(player1, 1 ether);
		int96 initialKingTaxRate = mountain.kingTaxRate();
		assertGt(initialKingTaxRate, 0, "Initial king tax stream should be more than zero");
		vm.startPrank(owner);
		streamInToken.deleteFlow(address(mountain), owner);
		vm.stopPrank();
		int96 newKingTaxRate = mountain.kingTaxRate();
		assertEq(newKingTaxRate, 0, "King tax stream should be stopped");
		__checkIfNotJailed();

		// check is feeCollector is still active
		int96 feeCollectorTaxRate = mountain.feeCollectorTaxRate();
		assertGt(feeCollectorTaxRate, 0, "Fee collector tax stream should be more than zero");

		// player 1 cancel stream
		vm.startPrank(player1);
		streamInToken.deleteFlow(player1, address(mountain));
		vm.stopPrank();

		// check is feeCollector stopped
		feeCollectorTaxRate = mountain.feeCollectorTaxRate();
		assertEq(feeCollectorTaxRate, 0, "Fee collector tax stream should be stopped");
		__checkIfNotJailed();
	}
}
