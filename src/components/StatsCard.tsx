import { FC, useMemo } from "react";
import styled from "styled-components";
import { useAccount, useBalance } from "wagmi";
import network from "../configuration/network";
import { useGameContext } from "../context/GameContext";
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

interface StatsCardProps {}

const StatsCard: FC<StatsCardProps> = ({}) => {
  const { address } = useAccount();
  const { army, step, king } = useGameContext();

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
    return army.add(step);
  }, [army, step]);

  const canBecomeKing = useMemo(() => {
    if (!armyNeeded || !armyBalance) return false;
    return armyNeeded.lte(armyBalance.value);
  }, [armyNeeded, armyBalance]);

  const isAlreadyKing = useMemo(
    () => address && king && address.toLowerCase() === king.toLowerCase(),
    [address, king]
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

      {isAlreadyKing && <div>You are the King!</div>}

      {armyNeeded && !isAlreadyKing && (
        <>
          {canBecomeKing ? (
            <PrimaryButton>Become a King!</PrimaryButton>
          ) : (
            <PrimaryButton disabled>
              You need{" "}
              <b>
                <Amount wei={armyNeeded} /> $ARMY
              </b>{" "}
              to become a <b>King</b>
            </PrimaryButton>
          )}
        </>
      )}
    </StyledStatsCard>
  );
};

export default StatsCard;
