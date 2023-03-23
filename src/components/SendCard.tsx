import { FC, useCallback, useMemo } from "react";
import styled from "styled-components";
import { useSigner } from "wagmi";
import network from "../configuration/network";
import {
  transactionByHashSelector,
  useAccountTransactionsSelector,
} from "../hooks/useAccountTransactions";
import { rpcApi } from "../redux/store";
import Paper from "./Paper";
import SendStreamForm from "./SendStreamForm";

const StyledSendCard = styled(Paper)`
  grid-area: send;
`;

interface SendCardProps {}

const SendCard: FC<SendCardProps> = ({}) => {
  const { data: signer } = useSigner();

  const [createFlow, createFlowResult] = rpcApi.useFlowCreateMutation();

  const pendingSendTransaction = useAccountTransactionsSelector(
    transactionByHashSelector(createFlowResult.data?.hash)
  );

  const onStartStream = useCallback(
    (flowRateWei: string) => {
      if (!signer) return;

      createFlow({
        chainId: network.id,
        flowRateWei,
        receiverAddress: network.hillAddress, // "0x6375Ce0E3947AB31e2f19c3AA94ca6C23c2422A7"
        superTokenAddress: network.cashToken,
        waitForConfirmation: true,
        userDataBytes: undefined,
        signer,
      });
    },
    [signer, createFlow]
  );

  const isLoading = useMemo(
    () =>
      createFlowResult.isLoading ||
      (!!pendingSendTransaction && pendingSendTransaction.status === "Pending"),
    [createFlowResult.isLoading, pendingSendTransaction]
  );

  return (
    <StyledSendCard>
      <SendStreamForm isLoading={isLoading} onSubmit={onStartStream} />
    </StyledSendCard>
  );
};

export default SendCard;
