import { FC, useCallback, useMemo } from "react";
import styled from "styled-components";
import { useAccount, useBalance, useSigner } from "wagmi";
import network from "../configuration/network";
import {
  transactionByHashSelector,
  useAccountTransactionsSelector,
} from "../hooks/useAccountTransactions";
import { rpcApi } from "../redux/store";
import Amount from "./Amount";
import Paper from "./Paper";
import StreamForm from "./StreamForm";
import { H6, Paragraph, SmallLabel } from "./Typography";
import { skipToken } from "@reduxjs/toolkit/dist/query";

const StyledSendCard = styled(Paper)`
  grid-area: send;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const SmallCard = styled(Paper)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.smallPaperBg};
`;

interface SendCardProps {}

const SendCard: FC<SendCardProps> = ({}) => {
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const activeFlowRequest = rpcApi.useGetActiveFlowQuery(
    address
      ? {
          chainId: network.id,
          receiverAddress: network.hillAddress,
          senderAddress: address,
          tokenAddress: network.cashToken,
        }
      : skipToken
  );

  const { data: cashBalance } = useBalance({
    address,
    token: network.cashToken,
  });

  const [createFlow, createFlowResult] = rpcApi.useFlowCreateMutation();
  const [deleteFlow, deleteFlowResult] = rpcApi.useFlowDeleteMutation();

  const pendingSendTransaction = useAccountTransactionsSelector(
    transactionByHashSelector(createFlowResult.data?.hash)
  );

  const pendingDeleteTransaction = useAccountTransactionsSelector(
    transactionByHashSelector(deleteFlowResult.data?.hash)
  );

  const onStartStream = useCallback(
    (flowRateWei: string) => {
      if (!signer) return;
      createFlow({
        chainId: network.id,
        flowRateWei,
        receiverAddress: network.hillAddress,
        superTokenAddress: network.cashToken,
        waitForConfirmation: true,
        userDataBytes: undefined,
        signer,
      });
    },
    [signer, createFlow]
  );

  const onCancelStream = useCallback(() => {
    if (!signer) return;
    deleteFlow({
      chainId: network.id,
      receiverAddress: network.hillAddress,
      superTokenAddress: network.cashToken,
      waitForConfirmation: true,
      userDataBytes: undefined,
      signer,
    });
  }, [signer, deleteFlow]);

  const isLoading = useMemo(
    () =>
      createFlowResult.isLoading ||
      deleteFlowResult.isLoading ||
      (!!pendingSendTransaction &&
        pendingSendTransaction.status === "Pending") ||
      (!!pendingDeleteTransaction &&
        pendingDeleteTransaction.status === "Pending"),
    [
      createFlowResult.isLoading,
      deleteFlowResult.isLoading,
      pendingSendTransaction,
      pendingDeleteTransaction,
    ]
  );

  return (
    <StyledSendCard>
      <H6>Send Stream and receive $ARMY</H6>
      <SmallCard>
        <Paragraph>$CASH</Paragraph>
        {cashBalance && (
          <SmallLabel>
            Available balance: <Amount wei={cashBalance.value} />
          </SmallLabel>
        )}
      </SmallCard>
      <StreamForm
        isLoading={isLoading}
        onOpenStream={onStartStream}
        onCancelStream={onCancelStream}
        activeFlowRate={activeFlowRequest.data?.flowRateWei}
      />
    </StyledSendCard>
  );
};

export default SendCard;
