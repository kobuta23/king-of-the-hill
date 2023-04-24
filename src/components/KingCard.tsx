import { FC } from "react";
import styled from "styled-components";
import { useGameContext } from "../context/GameContext";
import AddressName from "./AddressName";
import Flex from "./Flexbox";
import KnightAvatar from "./KnightAvatar";
import Paper from "./Paper";
import { H6, Paragraph } from "./Typography";

const StyledKingCard = styled(Paper)`
  grid-area: king;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Crown = styled.img`
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;
  height: 28px;
`;

const KingAvatar = styled.img`
  width: 56px;
`;

const KingAvatarWrapper = styled.div`
  position: relative;
  padding-top: 14px;
  padding-bottom: 14px;
`;

interface KingCardProps {}

const KingCard: FC<KingCardProps> = ({}) => {
  const { king } = useGameContext();

  return (
    <StyledKingCard>
      <H6>Ruling King</H6>

      {king && (
        <Flex direction="row" align="center" gap="12px">
          <KingAvatarWrapper>
            <Crown src="/crown.svg" />
            <KingAvatar src="/knight-1.png" />
          </KingAvatarWrapper>

          <Paragraph>
            <AddressName address={king} />
          </Paragraph>
        </Flex>
      )}
    </StyledKingCard>
  );
};

export default KingCard;
