import { FC } from "react";
import styled from "styled-components";
import Paper from "./Paper";
import { H4, H6, H7 } from "./Typography";

const StyledActiveKnightsCard = styled(Paper)`
  grid-area: knights;
`;

interface ActiveKnightsCardProps {}

const ActiveKnightsCard: FC<ActiveKnightsCardProps> = ({}) => {
  return (
    <StyledActiveKnightsCard>
      <H6>Active Knights</H6>
      <H4>589</H4>
    </StyledActiveKnightsCard>
  );
};

export default ActiveKnightsCard;
