import { FC } from "react";
import styled from "styled-components";
import { H2, H3 } from "./Typography";

const StyledHeaderCard = styled.div`
  grid-area: header;
  border-radius: 14px;
  background-image: url("/game-header.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  padding: 94px 80px;
  position: relative;
`;

const Crown = styled.img`
  width: 54px;
  display: block;
  margin-bottom: 12px;
`;

const Chest = styled.img`
  width: 280px;
  position: absolute;
  bottom: 0;
  right: 18%;
`;

const Gold = styled.img`
  width: 280px;
  position: absolute;
  bottom: -40px;
  right: 5%;
`;

const StyledH2 = styled(H2)`
  margin-top: -8px;
`;

interface HeaderCardProps {}

const HeaderCard: FC<HeaderCardProps> = ({}) => (
  <StyledHeaderCard>
    <Crown src="/crown.svg" />
    <H3>Become the</H3>
    <StyledH2>King of the Hill</StyledH2>
    <Chest src="/chest.svg" />
    <Gold src="/gold.svg" />
  </StyledHeaderCard>
);

export default HeaderCard;
