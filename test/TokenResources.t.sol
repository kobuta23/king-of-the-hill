// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import { TokenResources } from "./../src/tokens/TokenResources.sol";

contract TokenResourcesTest is Test {

    TokenResources public tokenResources;
    address public owner = address(0x01);

    function setUp() public virtual {
        vm.startPrank(owner);
        // create 5 ArmyUnitType in a array
        TokenResources.ArmyUnitType[] memory armyUnitTypes = new TokenResources.ArmyUnitType[](5);
        // create 5 ArmyUnitType
        for (uint i = 0; i < 5; i++) {
            armyUnitTypes[i] = TokenResources.ArmyUnitType({
                stoneToArmyExchangeRate: uint16(1),
                stoneTokenAddress: address(0x01),
                attackPowerUnit: uint32(10),
                defensePowerUnit: uint32(100)
            });
        }
        tokenResources = new TokenResources(owner, armyUnitTypes);
    }

    // check if owner has admin role
    function testOwnerHasAdminRole() public {
        assertTrue(tokenResources.hasRole(tokenResources.DEFAULT_ADMIN_ROLE(), owner));
    }

    // test each ArmyUnitType is created correctly
    function testArmyUnitType() public {
        for (uint256 i = 0; i < 5; i++) {
            TokenResources.ArmyUnitType memory armyUnitType = tokenResources.getArmyUnit(i+1);
            assertEq(armyUnitType.stoneToArmyExchangeRate, uint16(1));
            assertEq(armyUnitType.stoneTokenAddress, address(0x01));
            assertEq(armyUnitType.attackPowerUnit, uint32(10));
            assertEq(armyUnitType.defensePowerUnit, uint32(100));
        }
    }

    // set a new ArmyUnitType
    function testSetArmyUnitType() public {

        TokenResources.ArmyUnitType memory armyUnitType = TokenResources.ArmyUnitType({
            stoneToArmyExchangeRate: uint16(2),
            stoneTokenAddress: address(0x02),
            attackPowerUnit: uint32(20),
            defensePowerUnit: uint32(200)
        });
        uint256 lastTokenId = tokenResources.lastTokenId();
        tokenResources.setArmyUnit(lastTokenId + 1, armyUnitType);
        armyUnitType = tokenResources.getArmyUnit(lastTokenId + 1);
        assertEq(armyUnitType.stoneToArmyExchangeRate, uint16(2));
        assertEq(armyUnitType.stoneTokenAddress, address(0x02));
        assertEq(armyUnitType.attackPowerUnit, uint32(20));
        assertEq(armyUnitType.defensePowerUnit, uint32(200));

        assertEq(tokenResources.lastTokenId(), lastTokenId + 1);
    }

}
