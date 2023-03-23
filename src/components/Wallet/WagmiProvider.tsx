import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { FC, PropsWithChildren } from "react";
import { createClient as createWagmiClient, WagmiConfig } from "wagmi";
import { polygonMumbai } from "wagmi/chains";

import network from "@/src/configuration/network";
import { configureChains } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

export const { chains: wagmiChains, provider: wagmiRpcProvider } =
  configureChains(
    [polygonMumbai],
    [
      jsonRpcProvider({
        rpc: (chain) => {
          if (chain.id !== network.id) {
            throw new Error("Invalid network! This should not happen");
          }

          return { http: network.rpcUrls.superfluid.http[0] };
        },
      }),
    ]
  );

const { connectors } = getDefaultWallets({
  appName: "King of the hill",
  chains: wagmiChains,
});

export const wagmiClient = createWagmiClient({
  autoConnect: true,
  connectors,
  provider: wagmiRpcProvider,
});

const WagmiManager: FC<PropsWithChildren> = ({ children }) => {
  return <WagmiConfig client={wagmiClient}>{children}</WagmiConfig>;
};

export default WagmiManager;

export const RainbowKitManager: FC<PropsWithChildren> = ({ children }) => (
  <RainbowKitProvider chains={wagmiChains} initialChain={network.id}>
    {children}
  </RainbowKitProvider>
);
