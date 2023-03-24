import { BigNumber } from "ethers";
import { FC, useMemo } from "react";
import styled from "styled-components";
import network from "../configuration/network";
import { subgraphApi } from "../redux/store";
import FlowingBalance from "./FlowingBalance";
import Paper from "./Paper";
import { H4, H6, H7 } from "./Typography";

const StyledTreasuryCard = styled(Paper)`
  grid-area: treasury;
`;

interface TreasuryCardProps {}

const TreasuryCard: FC<TreasuryCardProps> = ({}) => {
  const cashSnapshotResponse = subgraphApi.useAccountTokenSnapshotQuery({
    chainId: network.id,
    id: `${network.hillAddress}-${network.cashToken}`,
  });

  const snapshot = useMemo(() => {
    if (!cashSnapshotResponse.data) return;
    const { balanceUntilUpdatedAt, updatedAtTimestamp, totalInflowRate } =
      cashSnapshotResponse.data;

    const taxFlowRate = BigNumber.from(totalInflowRate).div(10).toString();

    return {
      balanceUntilUpdatedAt,
      updatedAtTimestamp,
      totalNetFlowRate: taxFlowRate,
    };
  }, [cashSnapshotResponse.data]);

  return (
    <StyledTreasuryCard>
      <H6>Hill Treasury</H6>
      {snapshot && (
        <H4>
          <FlowingBalance
            balance={snapshot.balanceUntilUpdatedAt}
            balanceTimestamp={snapshot.updatedAtTimestamp}
            flowRate={snapshot.totalNetFlowRate}
          />
        </H4>
      )}
      <H7>$CASH</H7>
    </StyledTreasuryCard>
  );
};

export default TreasuryCard;
