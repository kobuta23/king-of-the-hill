import { FC } from "react";
import styled from "styled-components";
import Paper from "./Paper";
import { H4, H6, H7 } from "./Typography";

const StyledTaxCard = styled(Paper)`
  grid-area: tax;
`;

interface TaxCardProps {}

const TaxCard: FC<TaxCardProps> = ({}) => {
  return (
    <StyledTaxCard>
      <H6>Streamed Tax Value /day</H6>
      <H4>1234.95638000</H4>
      <H7>$CASH</H7>
    </StyledTaxCard>
  );
};

export default TaxCard;
