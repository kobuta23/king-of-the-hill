import { AccountTokenSnapshot } from "@superfluid-finance/sdk-core";
import { BigNumber } from "ethers";
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
  army?: BigNumber;
  step?: BigNumber;
  treasureSnapshot: AccountTokenSnapshot | null | undefined;
}
const GameContext = createContext<GameContextValue>(null!);

const GameContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data: king } = useContractRead({
    address: network.hillAddress,
    abi: KingOfTheHillABI,
    functionName: "king",
  });

  const { data: army } = useContractRead({
    address: network.hillAddress,
    abi: KingOfTheHillABI,
    functionName: "army",
  });

  const { data: step } = useContractRead({
    address: network.hillAddress,
    abi: KingOfTheHillABI,
    functionName: "step",
  });

  const hillTreasureSnapshotQuery = subgraphApi.useAccountTokenSnapshotQuery({
    chainId: network.id,
    id: `${network.hillAddress}-${network.cashToken}`,
  });

  const contextValue = useMemo(() => {
    return {
      king,
      army,
      step,
      treasureSnapshot: hillTreasureSnapshotQuery.data,
    };
  }, [king, army, step, hillTreasureSnapshotQuery.data]);

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

export default GameContextProvider;

export const useGameContext = () => useContext(GameContext);
