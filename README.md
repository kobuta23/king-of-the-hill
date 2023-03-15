# king-of-the-hill

### Rules of the game
- Users stream `cashToken` to the Contract (*the Hill*) to receive a stream of `armyToken`. This stream can't be updated.
- The flowrate of the `armyToken` stream will be determined by a `rate` which decreases by `decay` every second. This means your current rate is always the highest you'll ever get. 
- Users call `armyToken.send()` with an amount higher than `army` to `claim` the title of `king`
- When a user is the `king` they receive a `taxRate` stream representing almost all the incoming flows from users buying `armyToken`
- Part of the fees are accumulated in the contract, as defined by `treasureRate`
- When a new king `claim`s the `king` role, they take the accumulated `treasure` as an immediate reward, and start receiving the `taxRate` stream
