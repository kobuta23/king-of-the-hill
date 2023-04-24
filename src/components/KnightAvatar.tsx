import { FC } from "react";
import styled from "styled-components";

const StyledKnightAvatar = styled.img`
  display: block;
`;

interface KnightAvatarProps {
  rank: number;
}

const KnightAvatar: FC<KnightAvatarProps> = ({ rank = 1 }) => {
  return <StyledKnightAvatar src={`/knight-${rank}.png`} />;
};

export default KnightAvatar;
