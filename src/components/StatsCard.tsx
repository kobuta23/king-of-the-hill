import { getFramework } from "@superfluid-finance/sdk-redux";
import { Signer } from "ethers";
import { FC, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  useAccount,
  useBalance,
  usePrepareSendTransaction,
  useSendTransaction,
  useSigner,
} from "wagmi";
import network from "../configuration/network";
import { useGameContext } from "../context/GameContext";
import {
  transactionByHashSelector,
  useAccountTransactionsSelector,
} from "../hooks/useAccountTransactions";
import { rpcApi } from "../redux/store";
import AddressName from "./AddressName";
import Amount from "./Amount";
import Flex from "./Flexbox";
import Paper from "./Paper";
import PrimaryButton from "./PrimaryButton";
import { H6, H7, Paragraph } from "./Typography";

const StyledStatsCard = styled(Paper)`
  grid-area: stats;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const StatsHeading = styled.div`
  background-image: url("/stats-bg.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 12px;
  padding: 36px 64px 24px;
`;

const HelmSwordWrapper = styled.div`
  position: relative;
`;

const Helmet = styled.img`
  display: block;
  margin-top: -20px;
`;
const Sword = styled.img`
  position: absolute;
  left: -50%;
  bottom: -25%;
`;

const ArmySizeLabel = styled.p`
  margin: 0;
  font-size: 16px;
  text-align: center;
`;
interface StatsCardProps {}

const StatsCard: FC<StatsCardProps> = ({}) => {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const { army, step, king } = useGameContext();

  const [hash, setHash] = useState<string | undefined>(undefined);

  const pendingSendTransaction = useAccountTransactionsSelector(
    transactionByHashSelector(hash)
  );

  const { data: cashBalance } = useBalance({
    address,
    token: network.cashToken,
  });

  const { data: armyBalance } = useBalance({
    address,
    token: network.armyToken,
  });

  const armyNeeded = useMemo(() => {
    if (!army || !step) return null;
    return army.add(step).add("1");
  }, [army, step]);

  const canBecomeKing = useMemo(() => {
    if (!armyNeeded || !armyBalance) return false;
    return armyNeeded.lte(armyBalance.value);
  }, [armyNeeded, armyBalance]);

  const isAlreadyKing = useMemo(
    () => address && king && address.toLowerCase() === king.toLowerCase(),
    [address, king]
  );

  const becomeKing = async () => {
    if (!armyNeeded || !signer) return;

    const framework = await getFramework(network.id);
    const token = await framework.loadSuperToken(network.armyToken);

    const result = await token
      .send({
        amount: armyNeeded.toString(),
        recipient: network.hillAddress,
      })
      .exec(signer);
    setHash(result.hash);
  };

  useEffect(() => {
    if (
      pendingSendTransaction &&
      pendingSendTransaction.status === "Succeeded"
    ) {
      setHash(undefined);
    }
  }, [pendingSendTransaction]);

  const isLoading = useMemo(
    () =>
      !!pendingSendTransaction && pendingSendTransaction.status === "Pending",
    [pendingSendTransaction]
  );

  return (
    <StyledStatsCard>
      <H6>Your Stats</H6>
      <StatsHeading>
        <Flex direction="row" align="center" gap="24px">
          <HelmSwordWrapper>
            <Helmet src="/helmet.svg" />
            <Sword src="/sword.svg" />
          </HelmSwordWrapper>
          <Flex direction="column" gap="8px">
            {address && (
              <Paragraph>
                Knight:{" "}
                <b>
                  <AddressName address={address} />
                </b>
              </Paragraph>
            )}
            <Paragraph>
              Rank: <b>3</b>
            </Paragraph>
            <Paragraph>
              Ability: <b>Streaming</b>
            </Paragraph>
          </Flex>
        </Flex>
      </StatsHeading>

      <Flex direction="column" gap="4px">
        {cashBalance && (
          <Flex direction="row" justify="between">
            <Paragraph>$CASH Balance:</Paragraph>
            <Paragraph>
              <b>
                <Amount wei={cashBalance.value} />
              </b>
            </Paragraph>
          </Flex>
        )}

        {armyBalance && (
          <Flex direction="row" justify="between">
            <Paragraph>$ARMY Balance:</Paragraph>
            <Paragraph>
              <b>
                <Amount wei={armyBalance.value} />
              </b>
            </Paragraph>
          </Flex>
        )}
      </Flex>

      {isAlreadyKing && (
        <Flex direction="column" gap="12px">
          {army && (
            <ArmySizeLabel>
              Your <b>$ARMY</b> size is{" "}
              <b>
                <Amount wei={army} />
              </b>
            </ArmySizeLabel>
          )}
          <PrimaryButton disabled>You are the King!</PrimaryButton>
        </Flex>
      )}

      {!isAlreadyKing && (
        <Flex direction="column" gap="12px">
          {canBecomeKing && armyNeeded && (
            <ArmySizeLabel>
              You need{" "}
              <b>
                <Amount wei={armyNeeded} /> $ARMY
              </b>{" "}
              to become a <b>King</b>
            </ArmySizeLabel>
          )}

          {!canBecomeKing && armyNeeded && (
            <PrimaryButton disabled>
              You need{" "}
              <b>
                <Amount wei={armyNeeded} /> $ARMY
              </b>{" "}
              to become a <b>King</b>
            </PrimaryButton>
          )}

          {canBecomeKing && (
            <>
              <PrimaryButton onClick={becomeKing} isLoading={isLoading}>
                Become a King!
              </PrimaryButton>
            </>
          )}
        </Flex>
      )}
    </StyledStatsCard>
  );
};

export default StatsCard;
