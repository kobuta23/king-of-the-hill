# shogun

## Notes

- Superfluid Protocol: The contract uses the Superfluid protocol for money streaming. Two streams are created, streamInToken and streamOutToken, which are tokens being streamed in and out of the contract
- Tax Mechanism: The contract has a mechanism to distribute taxes amongst different entities: king, fee collector, and treasury. The distribution rates are fixed: 50% for king, 20% for fee collector, and the rest for the treasury.
- Attacking Mechanic: Users can attack the current king. If the total attack power of the user is greater than the total defense power of the king, the user becomes the new king. All tokens of the old king are transferred to him, and all of the attacker's tokens are transferred to the contract. Also, the previous flow of tokens to the old king is deleted, and a new flow is created to the new king.
- Stream Creation, Update, and Deletion: The contract allows the creation, update, and deletion of streams. However, it disallows stream updates by reverting any transaction that attempts to update the stream.
- Cooldown Mechanism: There is a cooldown mechanism in place, which prevents a user from creating a new stream if they're within the cooldown period.
- ERC1155 Compatibility: The contract inherits from the ERC1155Holder contract from the OpenZeppelin library, which allows it to interact with ERC1155 tokens.
- Flow Rate Restrictions: The contract ensures that the inflow rate is within a specified minimum and maximum rate