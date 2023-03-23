import { FC } from "react";
import styled from "styled-components";
import Paper from "./Paper";
import { H4, H6, H7 } from "./Typography";

const StyledTreasuryCard = styled(Paper)`
  grid-area: treasury;
`;

interface TreasuryCardProps {}

const TreasuryCard: FC<TreasuryCardProps> = ({}) => {
  return (
    <StyledTreasuryCard>
      <H6>Hill Treasury</H6>
      <H4>1234.95638000</H4>
      <H7>$CASH</H7>
    </StyledTreasuryCard>
  );
};

export default TreasuryCard;
