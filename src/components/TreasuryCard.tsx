import { FC } from "react";
import styled from "styled-components";
import { useBalance } from "wagmi";
import network from "../configuration/network";
import Amount from "./Amount";
import Paper from "./Paper";
import { H4, H6, H7 } from "./Typography";

const StyledTreasuryCard = styled(Paper)`
  grid-area: treasury;
`;

interface TreasuryCardProps {}

const TreasuryCard: FC<TreasuryCardProps> = ({}) => {
  const { data: cashBalance } = useBalance({
    address: network.hillAddress,
    token: network.cashToken,
  });

  return (
    <StyledTreasuryCard>
      <H6>Hill Treasury</H6>
      {cashBalance && (
        <H4>
          <Amount wei={cashBalance.value} />
        </H4>
      )}
      <H7>$CASH</H7>
    </StyledTreasuryCard>
  );
};

export default TreasuryCard;
