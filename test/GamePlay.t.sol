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

	function testTakeKingPosition() public {
		// get some stone token
		__fundAndOpenStreamToMountain(player1, 1 ether);
		vm.warp(1000);
		vm.startPrank(player1);
		// approve tokenResources to take tokens
		streamOutToken.approve(address(tokenResources), INT256_MAX_AS_UINT256);
		// approve mountain to take tokens
		tokenResources.setApprovalForAll(address(mountain), true);
		// convert it to army
		tokenResources.fullSwap();
		// check my attack and defense power
		(uint256 attackPower, uint256 defensePower) = tokenResources.getTotalArmyPowers(player1);
		assertTrue(attackPower > 0, "attackPower should be greater than 0");
		assertTrue(defensePower > 0, "defensePower should be greater than 0");

		// attack mountain
		mountain.attack();
		// get king
		address king = mountain.king();
		assertEq(king, player1, "wrong king");

		// check if player is getting a stream back
		(, int96 inFlowRate , , ) = streamInToken.getFlowInfo(address(mountain), player1);
		assertTrue(inFlowRate > 0, "inFlowRate should be greater than 0");
		__checkIfNotJailed();
	}
}
