import { FC } from "react";
import styled from "styled-components";

const StyledRankBadge = styled.div`
  display: inline-block;
  position: relative;
`;

const RankImage = styled.img`
  margin: 0 auto;
  display: block;
`;

const RankNumber = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 700;
`;

interface RankBadgeProps {
  rank: number;
}

const RANKS = ["gold", "silver", "bronze", "iron"];

const RankBadge: FC<RankBadgeProps> = ({ rank }) => {
  const rankColor = RANKS[rank - 1] || "iron";

  return (
    <StyledRankBadge>
      <RankImage src={`/${rankColor}.png`} />
      <RankNumber>{rank}</RankNumber>
    </StyledRankBadge>
  );
};

export default RankBadge;
