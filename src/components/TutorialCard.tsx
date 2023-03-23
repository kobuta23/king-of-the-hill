import { FC } from "react";
import styled from "styled-components";
import Paper from "./Paper";
import { H6, Label, Paragraph } from "./Typography";

const StyledTutorialCard = styled(Paper)`
  grid-area: guide;
`;

const TutorialList = styled.ul`
  list-style-type: numb;
  margin: 16px 0;
  padding-left: 16px;
  font-size: 18px;

  li {
    padding-bottom: 8px;
  }
`;

interface TutorialCardProps {}

const TutorialCard: FC<TutorialCardProps> = ({}) => {
  return (
    <StyledTutorialCard>
      <H6>How to play?</H6>
      <TutorialList>
        <li>Stream $CASH.</li>
        <li>Receive $ARMY.</li>
        <li>Fight with King and other Knights to raise the biggest Army.</li>
        <li>
          Become new ruling King and collect $CASH taxes from the Knights!
        </li>
      </TutorialList>
      <Paragraph>$CASH price get’s lower by the block!</Paragraph>
    </StyledTutorialCard>
  );
};

export default TutorialCard;
