import { FC } from "react";
import styled from "styled-components";
import { useGameContext } from "../context/GameContext";
import AddressName from "./AddressName";
import Paper from "./Paper";
import { H6, Paragraph } from "./Typography";

const StyledKingCard = styled(Paper)`
  grid-area: king;
`;

interface KingCardProps {}

const KingCard: FC<KingCardProps> = ({}) => {
  const { king } = useGameContext();

  return (
    <StyledKingCard>
      <H6>Ruling King</H6>
      {king && (
        <Paragraph>
          <AddressName address={king} />
        </Paragraph>
      )}
    </StyledKingCard>
  );
};

export default KingCard;
