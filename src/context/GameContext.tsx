import { AccountTokenSnapshot } from "@superfluid-finance/sdk-core";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import { useContractRead } from "wagmi";
import KingOfTheHillABI from "../configuration/KingOfTheHillABI";
import network from "../configuration/network";
import { subgraphApi } from "../redux/store";

interface GameContextValue {
  king?: string;
  treasureSnapshot: AccountTokenSnapshot | null | undefined;
}
const GameContext = createContext<GameContextValue>(null!);

const GameContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data: king } = useContractRead({
    address: network.hillAddress,
    abi: KingOfTheHillABI,
    functionName: "king",
  });

  const hillTreasureSnapshotQuery = subgraphApi.useAccountTokenSnapshotQuery({
    chainId: network.id,
    id: `${network.hillAddress}-${network.cashToken}`,
  });

  const contextValue = useMemo(() => {
    return { king, treasureSnapshot: hillTreasureSnapshotQuery.data };
  }, [king, hillTreasureSnapshotQuery.data]);

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

export default GameContextProvider;

export const useGameContext = () => useContext(GameContext);
