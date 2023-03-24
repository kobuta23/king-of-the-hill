import { FC } from "react";
import styled from "styled-components";
import network from "../configuration/network";
import { subgraphApi } from "../redux/store";
import Paper from "./Paper";
import { H4, H6, H7 } from "./Typography";

const StyledActiveKnightsCard = styled(Paper)`
  grid-area: knights;
`;

interface ActiveKnightsCardProps {}

const ActiveKnightsCard: FC<ActiveKnightsCardProps> = ({}) => {
  const tokenStatsRequest = subgraphApi.useTokenStatisticQuery({
    chainId: network.id,
    id: network.cashToken,
  });

  return (
    <StyledActiveKnightsCard>
      <H6>Active Knights</H6>
      {tokenStatsRequest.data && (
        <H4>{tokenStatsRequest.data.totalNumberOfActiveStreams}</H4>
      )}
    </StyledActiveKnightsCard>
  );
};

export default ActiveKnightsCard;
