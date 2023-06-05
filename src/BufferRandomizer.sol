// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC721 } from "./interfaces/IERC721.sol";

contract BufferRandomizer {

	error NotOwner();
	error IndexOutOfBounds();
	error InvalidBaseValue();
	error InvalidTier();
	error InvalidWeights();

	address private owner;
	int16[] private availableBuffs;

	struct Tier {
		uint8 tier;
		uint8 mul;
		int16 buff;
	}

	mapping(address => Tier) public nftToBuffTier;

	constructor(int16[] memory buffs, address[] memory nftAddresses, Tier[] memory tiers) {
		owner = msg.sender;
		if (nftAddresses.length != tiers.length) revert IndexOutOfBounds();

		// add buffs
		for (uint256 i = 0; i < buffs.length; i++) {
			availableBuffs.push(buffs[i]);
		}
		// map nft to tier
		for (uint256 i = 0; i < nftAddresses.length; i++) {
			nftToBuffTier[nftAddresses[i]] = tiers[i];
		}
	}

	modifier onlyOwner {
		if(msg.sender != owner) revert NotOwner();
		_;
	}

	function getRandomWeight() public view returns (int16) {
		return _getRandomWeight();
	}

	function getRandomBuff(int256 baseValue, address nftAddress, uint256 nftId) public returns (int256 adjustedValue) {
		if(baseValue == 0) revert InvalidBaseValue();
		if(availableBuffs.length == 0) revert InvalidWeights();

		int16 randomWeight = nftAddress == address(0) ? _getRandomWeight() : _getRandomWeightWithNFTBuffer(nftAddress, nftId);
		// 100 because we are working with percentages
		adjustedValue = baseValue + (baseValue * int256(randomWeight) / 100);
	}

	function addBuff(int16 buff) public onlyOwner {
		availableBuffs.push(buff);
	}

	function removeBuffAndReplace(uint256 index) public onlyOwner {
		uint256 length = availableBuffs.length;
		if(length == 0 || index >= length) revert IndexOutOfBounds();
		availableBuffs[index] = availableBuffs[length - 1];
		availableBuffs.pop();
	}

	function removeBuffAndShift(uint256 index) public onlyOwner {
		uint256 length = availableBuffs.length;
		if(length == 0 || index >= length) revert IndexOutOfBounds();
		length = length - 1;
		for (uint256 i = index; i < length; i++) {
			availableBuffs[i] = availableBuffs[i + 1];
		}
		availableBuffs.pop();
	}

	function getBuffs() public view returns (int16[] memory) {
		return availableBuffs;
	}

	function getBuff(uint256 index) public view returns (int16) {
		return availableBuffs[index];
	}

	function addAcceptedNFT(address nftAddress, Tier memory tier) public onlyOwner {
		nftToBuffTier[nftAddress] = tier;
	}

	function isAcceptedNFT(address nftAddress) public view returns (bool) {
		return nftToBuffTier[nftAddress].tier != 0;
	}

	function getTier(address nftAddress) public view returns (Tier memory) {
		return nftToBuffTier[nftAddress];
	}

	function _getRandomWeightWithNFTBuffer(address nftAddress, uint256 nftId) internal returns (int16) {
		if(nftToBuffTier[nftAddress].tier == 0) revert InvalidTier();

		Tier memory nftTier = nftToBuffTier[nftAddress];
		uint256 availableBuffsLength = availableBuffs.length;
		uint256 weightLength = availableBuffsLength + nftTier.mul;

		// Create a temporary array to hold the potential buffs
		int16[] memory tempBuffArray = new int16[](weightLength);

		// Copy the buffs from the original array
		for (uint i = 0; i < availableBuffsLength; i++) {
			tempBuffArray[i] = availableBuffs[i];
		}

		for (uint256 i = availableBuffsLength - 1; i < weightLength; i++) {
			tempBuffArray[i] = nftTier.buff;
		}

		// Burn the NFT
		IERC721(nftAddress).transferFrom(msg.sender, address(this), nftId);
		IERC721(nftAddress).burn(nftId);

		return tempBuffArray[_getHashModule(weightLength)];
	}

	function _getHashModule(uint256 arrayLength) internal view returns (uint256) {
		return uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number), msg.sender))) % arrayLength;
	}

	function _getRandomWeight() internal view returns (int16) {
		return availableBuffs[_getHashModule(availableBuffs.length)];
	}

}
