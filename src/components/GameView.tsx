import { FC } from "react";
import styled from "styled-components";
import ActiveKnightsCard from "./ActiveKnightsCard";
import Grid from "./Grid";
import HeaderCard from "./HeaderCard";
import HighscoreTable from "./HighscoreTable/HighscoreTable";
import KingCard from "./KingCard";
import SendCard from "./SendCard";
import StatsCard from "./StatsCard";
import TaxCard from "./TaxCard";
import TreasuryCard from "./TreasuryCard";
import TutorialCard from "./TutorialCard";

const GameGrid = styled(Grid)`
  grid-template-areas:
    "header header header header header header"
    ". . . . . ."
    "send send guide treasury treasury knights"
    "send send guide tax tax king"
    "stats stats highscore highscore highscore highscore";

  column-gap: 20px;
  row-gap: 20px;
`;

const GameLayout = styled.div`
  max-width: ${({ theme }) => theme.layout.width};
  margin: 60px auto;
`;

interface GameViewProps {}

const GameView: FC<GameViewProps> = ({}) => {
  return (
    <GameLayout>
      <GameGrid columns="repeat(6, 1fr)" rows="auto 16px 1fr 1fr auto">
        <HeaderCard />
        <SendCard />
        <TutorialCard />
        <TreasuryCard />
        <TaxCard />
        <ActiveKnightsCard />
        <KingCard />
        <StatsCard />
        <HighscoreTable />
      </GameGrid>
    </GameLayout>
  );
};

export default GameView;
