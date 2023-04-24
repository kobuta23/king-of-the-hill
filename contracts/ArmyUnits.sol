// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IArmyUnits } from "./interfaces/IArmyUnits.sol";

contract ArmyUnits is IArmyUnits {

    IArmyUnits.UnitType[] public units;

    constructor(IArmyUnits.UnitType[] memory _units) {
        for (uint256 i = 0; i < _units.length; i++) {
            require(address(_units[i].token) != address(0), "ArmyUnits: token address cannot be zero");
            units.push(_units[i]);
        }
    }

    function getUnitProperties(address user) public view override returns (uint256 totalStrength, uint256 totalDefense) {

        totalStrength = 0;
        totalDefense = 0;

        for (uint256 i = 0; i < units.length; i++) {
            uint256 balance = units[i].token.balanceOf(user);
            uint256 fullTokens = balance / 1e18;

            totalStrength += fullTokens * units[i].strength;
            totalDefense += fullTokens * units[i].defense;
        }
    }

    // list all tokens that compose an army
    function getArmyTokens() public view override returns (address[] memory) {
        address[] memory tokens = new address[](units.length);
        for (uint256 i = 0; i < units.length; i++) {
            tokens[i] = address(units[i].token);
        }
        return tokens;
    }

    // list each army unit and its properties
    function getArmyProperties() public view override returns (IArmyUnits.UnitType[] memory) {
       return units;
    }
}
