import { FC, useCallback } from "react";
import styled from "styled-components";
import { useAccount, useDisconnect } from "wagmi";
import ActiveKnightsCard from "./ActiveKnightsCard";
import Flex from "./Flexbox";
import Grid from "./Grid";
import HeaderCard from "./HeaderCard";
import HighscoreTable from "./HighscoreTable/HighscoreTable";
import KingCard from "./KingCard";
import Paper from "./Paper";
import PrimaryButton from "./PrimaryButton";
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

  column-gap: 16px;
  row-gap: 16px;
`;

const GameLayout = styled.div`
  max-width: ${({ theme }) => theme.layout.width};
  margin: 60px auto;
`;

interface GameViewProps {}

const GameView: FC<GameViewProps> = ({}) => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const onDisconnect = useCallback(() => disconnect(), [disconnect]);

  return (
    <GameLayout>
      <Flex direction="row">
        <h4>{address}</h4>
        <PrimaryButton onClick={onDisconnect}>Disconnect</PrimaryButton>
      </Flex>

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
