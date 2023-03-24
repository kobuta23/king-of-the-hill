import {
  getFramework,
  RpcEndpointBuilder,
} from "@superfluid-finance/sdk-redux";

export interface Web3FlowInfo {
  updatedAtTimestamp: number;
  flowRateWei: string;
  depositWei: string;
  owedDepositWei: string;
}

export const adHocRpcEndpoints = {
  endpoints: (builder: RpcEndpointBuilder) => ({
    getActiveFlow: builder.query<
      Web3FlowInfo | null,
      {
        chainId: number;
        tokenAddress: string;
        senderAddress: string;
        receiverAddress: string;
      }
    >({
      queryFn: async (arg) => {
        const framework = await getFramework(arg.chainId);
        const token = await framework.loadSuperToken(arg.tokenAddress);
        const result: Web3FlowInfo = await token
          .getFlow({
            sender: arg.senderAddress,
            receiver: arg.receiverAddress,
            providerOrSigner: framework.settings.provider,
          })
          .then((x) => ({
            updatedAtTimestamp: x.timestamp.getTime(),
            depositWei: x.deposit,
            flowRateWei: x.flowRate,
            owedDepositWei: x.owedDeposit,
          }));
        return {
          data: result.flowRateWei !== "0" ? result : null,
        };
      },
      providesTags: (_result, _error, arg) => [
        {
          type: "GENERAL",
          id: arg.chainId, // TODO(KK): Could be made more specific.
        },
      ],
    }),
  }),
};
