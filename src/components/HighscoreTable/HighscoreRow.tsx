import { AccountTokenSnapshot } from "@superfluid-finance/sdk-core";
import { FC } from "react";
import AddressName from "../AddressName";
import FlowingBalance from "../FlowingBalance";
import RankBadge from "../RankBadge";
import { TD } from "../Table";

interface HighscoreRowProps {
  rank: number;
  account: string;
  armyTokenSnapshot: AccountTokenSnapshot;
  goldTokenSnapshot?: AccountTokenSnapshot;
}

const HighscoreRow: FC<HighscoreRowProps> = ({
  rank,
  account,
  armyTokenSnapshot,
  goldTokenSnapshot,
}) => {
  return (
    <tr>
      <TD align="left">
        <RankBadge rank={rank} />
      </TD>
      <TD>
        <AddressName address={account} />
      </TD>
      <TD align="right">
        {goldTokenSnapshot && (
          <FlowingBalance
            balance={goldTokenSnapshot.balanceUntilUpdatedAt}
            balanceTimestamp={goldTokenSnapshot.updatedAtTimestamp}
            flowRate={goldTokenSnapshot.totalNetFlowRate}
          />
        )}
      </TD>
      <TD align="right">
        <FlowingBalance
          balance={armyTokenSnapshot.balanceUntilUpdatedAt}
          balanceTimestamp={armyTokenSnapshot.updatedAtTimestamp}
          flowRate={armyTokenSnapshot.totalNetFlowRate}
        />
      </TD>
    </tr>
  );
};

export default HighscoreRow;
