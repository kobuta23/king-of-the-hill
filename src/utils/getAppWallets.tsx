import {
  Chain,
  connectorsForWallets,
  Wallet,
  WalletList,
} from "@rainbow-me/rainbowkit";
import {
  braveWallet,
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { InjectedConnector } from "wagmi/connectors/injected";

export interface InjectedWalletOptions {
  chains: Chain[];
  shimDisconnect?: boolean;
}

export const namedInjectedWallet = ({
  chains,
  shimDisconnect,
}: InjectedWalletOptions): Wallet => {
  const injectedConnector = new InjectedConnector({
    chains,
    options: { shimDisconnect },
  });
  const defaultInjectedWallet = injectedWallet({ chains });

  return {
    id: defaultInjectedWallet.id,
    name: injectedConnector.name,
    iconUrl: defaultInjectedWallet.iconUrl,
    iconBackground: defaultInjectedWallet.iconBackground,
    hidden: ({ wallets }) =>
      wallets.some(
        ({ installed, connector }) =>
          installed &&
          (connector instanceof InjectedConnector ||
            connector.name.toLowerCase() ===
              injectedConnector.name.toLowerCase())
      ),
    createConnector: () => ({
      connector: injectedConnector,
    }),
  };
};

// Inspired by: https://github.com/rainbow-me/rainbowkit/blob/main/packages/rainbowkit/src/wallets/getDefaultWallets.ts
export const getAppWallets = ({
  appName,
  chains,
}: {
  appName: string;
  chains: Chain[];
}): {
  connectors: ReturnType<typeof connectorsForWallets>;
  wallets: WalletList;
} => {
  const wallets: WalletList = [
    {
      groupName: "Popular",
      wallets: [
        namedInjectedWallet({ chains, shimDisconnect: true }),
        braveWallet({ chains, shimDisconnect: true }),
        metaMaskWallet({
          chains,
          shimDisconnect: true,
        }),
        walletConnectWallet({ chains }),
        coinbaseWallet({ appName, chains }),
      ],
    },
  ];

  return {
    connectors: connectorsForWallets(wallets),
    wallets,
  };
};
