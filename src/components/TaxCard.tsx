import { BigNumber } from "ethers";
import { FC, useMemo } from "react";
import styled from "styled-components";
import network from "../configuration/network";
import { subgraphApi } from "../redux/store";
import { UnitOfTime } from "../utils/UnitOfTime";
import Amount from "./Amount";
import Paper from "./Paper";
import { H4, H6, H7 } from "./Typography";

const StyledTaxCard = styled(Paper)`
  grid-area: tax;
`;

interface TaxCardProps {}

const TaxCard: FC<TaxCardProps> = ({}) => {
  const taxSnapshotResult = subgraphApi.useAccountTokenSnapshotQuery({
    chainId: network.id,
    id: `${network.hillAddress.toLowerCase()}-${network.cashToken.toLowerCase()}`,
  });

  const dailyTax = useMemo(() => {
    if (!taxSnapshotResult.data) return null;
    return BigNumber.from(taxSnapshotResult.data.totalInflowRate)
      .mul(UnitOfTime.Day)
      .toString();
  }, [taxSnapshotResult]);

  return (
    <StyledTaxCard>
      <H6>Streamed Tax Value /day</H6>
      {dailyTax && (
        <H4>
          <Amount wei={dailyTax} />
        </H4>
      )}
      <H7>$CASH</H7>
    </StyledTaxCard>
  );
};

export default TaxCard;
