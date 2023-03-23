import { Framework } from "@superfluid-finance/sdk-core";
import {
  initiateOldPendingTransactionsTrackingThunk,
  setFrameworkForSdkRedux,
} from "@superfluid-finance/sdk-redux";
import { FC, PropsWithChildren, useEffect } from "react";
import { Provider } from "react-redux";
import { useAccount, useSigner } from "wagmi";
import network from "../configuration/network";
import { reduxStore, useAppDispatch } from "./store";
import promiseRetry from "promise-retry";
import { wagmiRpcProvider } from "../components/Wallet/WagmiProvider";

// Initialize SDK-core Frameworks for SDK-redux.
setFrameworkForSdkRedux(network.id, () =>
  Framework.create({
    chainId: network.id,
    provider: wagmiRpcProvider({ chainId: network.id }),
    customSubgraphQueriesEndpoint: network.subgraphUrl,
  })
);

const ReduxProviderCore: FC<PropsWithChildren> = ({ children }) => {
  const { connector: activeConnector } = useAccount();
  const { data: signer } = useSigner();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (signer && activeConnector) {
      signer.getAddress().then((address) => {
        dispatch(
          initiateOldPendingTransactionsTrackingThunk({
            chainIds: [network.id],
            signerAddress: address,
          }) as any
        );
      });
    }
  }, [signer]);

  return <>{children}</>;
};

const ReduxProvider: FC<PropsWithChildren> = ({ children }) => (
  <Provider store={reduxStore}>
    <ReduxProviderCore>{children}</ReduxProviderCore>
  </Provider>
);

export default ReduxProvider;
