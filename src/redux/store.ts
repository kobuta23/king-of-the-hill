import { autoBatchEnhancer, configureStore, Dispatch } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  allRpcEndpoints,
  allSubgraphEndpoints,
  createApiWithReactHooks,
  initializeRpcApiSlice,
  initializeSubgraphApiSlice,
  initializeTransactionTrackerSlice,
} from "@superfluid-finance/sdk-redux";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { adHocRpcEndpoints } from "./apis/adHocRpcEndpoints";
import { ensApi } from "./apis/ensApi.slice";

export const rpcApi = initializeRpcApiSlice(createApiWithReactHooks)
  .injectEndpoints(allRpcEndpoints)
  .injectEndpoints(adHocRpcEndpoints);

export const subgraphApi = initializeSubgraphApiSlice(
  createApiWithReactHooks
).injectEndpoints(allSubgraphEndpoints);

export const transactionTracker = initializeTransactionTrackerSlice();

export const reduxStore = configureStore({
  reducer: {
    [rpcApi.reducerPath]: rpcApi.reducer,
    [subgraphApi.reducerPath]: subgraphApi.reducer,
    [transactionTracker.reducerPath]: transactionTracker.reducer,
    [ensApi.reducerPath]: ensApi.reducer,
  },
  enhancers: (existingEnhancers) =>
    existingEnhancers.concat(
      autoBatchEnhancer({
        type: typeof window !== "undefined" ? "raf" : "tick",
      })
    ), // https://redux-toolkit.js.org/api/autoBatchEnhancer#autobatchenhancer-1
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(rpcApi.middleware)
      .concat(subgraphApi.middleware)
      .concat(ensApi.middleware),
});

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors of RTK-Query
setupListeners(reduxStore.dispatch);

export type AppStore = typeof reduxStore;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = () => useDispatch<Dispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
