import { memo, ReactElement } from "react";
import useSignificantFlowingDecimal from "../hooks/useEtherSignificantFlowingDecimal";
import useFlowingBalance from "../hooks/useFlowingBalance";
import Amount from "./Amount";

export interface FlowingBalanceProps {
  balance: string;
  /**
   * Timestamp in seconds.
   */
  balanceTimestamp: number;
  flowRate: string;
  disableRoundingIndicator?: boolean;
  tokenSymbol?: string;
}

export default memo(function FlowingBalance({
  balance,
  balanceTimestamp,
  flowRate,
  tokenSymbol,
}: FlowingBalanceProps): ReactElement {
  const { weiValue } = useFlowingBalance(balance, balanceTimestamp, flowRate);

  const decimalPlaces = useSignificantFlowingDecimal(flowRate);

  return (
    <>
      <Amount wei={weiValue} decimalPlaces={decimalPlaces} /> {tokenSymbol}
    </>
  );
});
