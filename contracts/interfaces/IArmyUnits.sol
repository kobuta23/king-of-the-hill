// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IArmyUnits {

    struct UnitType {
        IERC20 token;
        uint256 strength;
        uint256 defense;
    }

    // @dev get the strength and defense of a player's army
    function getUnitProperties(address player) external view returns (uint256 strength, uint256 defense);

    // @dev list all tokens that compose an army
    function getArmyTokens() external view returns (address[] memory);

    // @dev list each army unit and its properties
    function getArmyProperties() external view returns (UnitType[] memory);
}
