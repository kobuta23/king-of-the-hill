import network from "@/src/configuration/network";
import { subgraphApi } from "@/src/redux/store";
import { AccountTokenSnapshot } from "@superfluid-finance/sdk-core";
import { FC, useMemo } from "react";
import styled from "styled-components";
import Paper from "../Paper";
import { Table, TH } from "../Table";
import { H6 } from "../Typography";
import HighscoreRow from "./HighscoreRow";

const StyledHighscoreTable = styled(Paper)`
  grid-area: highscore;
`;

const Divider = styled.div`
  background: ${({ theme }) => theme.colors.delimiter};
  height: 1px;
  width: calc(100% + 48px);
  margin: 20px -24px 0;
`;

interface HighscoreItem {
  armyTokenSnapshot: AccountTokenSnapshot;
  goldTokenSnapshot?: AccountTokenSnapshot;
}

interface HighscoreTableProps {}

const HighscoreTable: FC<HighscoreTableProps> = ({}) => {
  const armyTokenSnapshotsQuery = subgraphApi.useAccountTokenSnapshotsQuery({
    chainId: network.id,
    filter: {
      token: network.armyToken.toLowerCase(),
      account_not: "0x0000000000000000000000000000000000000000",
    },
    pagination: {
      take: 5,
      skip: 0,
    },
    order: {
      orderBy: "balanceUntilUpdatedAt",
      orderDirection: "desc",
    },
  });

  const goldTokenSnapshotsQuery = subgraphApi.useAccountTokenSnapshotsQuery({
    chainId: network.id,
    filter: {
      token: network.cashToken.toLowerCase(),
    },
    pagination: {
      take: Infinity,
      skip: 0,
    },
  });

  const highscoreItems: Array<HighscoreItem> = useMemo(() => {
    if (armyTokenSnapshotsQuery.data && goldTokenSnapshotsQuery.data) {
      const goldTokenSnapshots = goldTokenSnapshotsQuery.data.items;

      return armyTokenSnapshotsQuery.data.items.map((armyTokenSnapshot) => {
        const goldTokenSnapshot = goldTokenSnapshots.find(
          (goldTokenSnapshot) =>
            goldTokenSnapshot.account === armyTokenSnapshot.account
        );

        return {
          armyTokenSnapshot,
          goldTokenSnapshot,
        };
      });
    }

    return [];
  }, [armyTokenSnapshotsQuery.data, goldTokenSnapshotsQuery.data]);

  return (
    <StyledHighscoreTable>
      <H6>Ranking</H6>
      <Divider />
      <Table>
        <thead>
          <tr>
            <TH width="100px" align="left">
              Rank
            </TH>
            <TH width="150px" align="left">
              Knight
            </TH>
            <TH width="200px" align="right">
              $CASH Balance
            </TH>
            <TH width="200px" align="right">
              $ARMY Balance
            </TH>
          </tr>
        </thead>
        <tbody>
          {highscoreItems.map(
            ({ armyTokenSnapshot, goldTokenSnapshot }, index) => (
              <HighscoreRow
                key={armyTokenSnapshot.id}
                rank={index + 1}
                account={armyTokenSnapshot.account}
                armyTokenSnapshot={armyTokenSnapshot}
                goldTokenSnapshot={goldTokenSnapshot}
              />
            )
          )}
        </tbody>
      </Table>
    </StyledHighscoreTable>
  );
};

export default HighscoreTable;
