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
        <li>Send your $ARMY to become King of Hill.</li>
        <li>
          As the ruling King, collect $CASH taxes from all the Knights!
        </li>
      </TutorialList>
      <Paragraph>$ARMY gets more expensive every block!</Paragraph>
    </StyledTutorialCard>
  );
};

export default TutorialCard;
