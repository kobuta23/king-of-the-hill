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
import SendStreamForm from "./SendStreamForm";
import { H6, Paragraph, SmallLabel } from "./Typography";

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

  const { data: cashBalance } = useBalance({
    address,
    token: network.cashToken,
  });

  const [createFlow, createFlowResult] = rpcApi.useFlowCreateMutation();

  const pendingSendTransaction = useAccountTransactionsSelector(
    transactionByHashSelector(createFlowResult.data?.hash)
  );

  const onStartStream = useCallback(
    (flowRateWei: string) => {
      if (!signer) return;
      console.log({ flowRateWei });
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

  const isLoading = useMemo(
    () =>
      createFlowResult.isLoading ||
      (!!pendingSendTransaction && pendingSendTransaction.status === "Pending"),
    [createFlowResult.isLoading, pendingSendTransaction]
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
      <SendStreamForm isLoading={isLoading} onSubmit={onStartStream} />
    </StyledSendCard>
  );
};

export default SendCard;
