import KingOfTheHillABI from "@/src/configuration/KingOfTheHillABI";
import network from "@/src/configuration/network";
import {
  getFramework,
  registerNewTransactionAndReturnQueryFnResult,
  RpcEndpointBuilder,
  TransactionInfo,
} from "@superfluid-finance/sdk-redux";
import { readContract } from "@wagmi/core";
import { BigNumber, Signer } from "ethers";
import { parseEther } from "ethers/lib/utils.js";

export interface Web3FlowInfo {
  updatedAtTimestamp: number;
  flowRateWei: string;
  depositWei: string;
  owedDepositWei: string;
}

declare module "@superfluid-finance/sdk-redux" {
  interface TransactionTitleOverrides {
    "Become King": true;
  }
}

export const adHocRpcEndpoints = {
  endpoints: (builder: RpcEndpointBuilder) => ({
    becomeKing: builder.mutation<
      TransactionInfo,
      { amount: string; signer: Signer }
    >({
      queryFn: async (arg, queryApi) => {
        const framework = await getFramework(network.id);
        const token = await framework.loadSuperToken(network.armyToken);

        const transactionResponse = await token
          .send({
            amount: arg.amount,
            recipient: network.hillAddress,
          })
          .exec(arg.signer);

        return await registerNewTransactionAndReturnQueryFnResult({
          transactionResponse,
          chainId: network.id,
          signer: await arg.signer.getAddress(),
          waitForConfirmation: false,
          dispatch: queryApi.dispatch,
          title: "Become King",
          extraData: undefined,
        });
      },
    }),

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
          id: arg.chainId,
        },
      ],
    }),

    getActiveKing: builder.query<string, void>({
      queryFn: async () => {
        const king = await readContract({
          address: network.hillAddress,
          abi: KingOfTheHillABI,
          functionName: "king",
        });

        return {
          data: king,
        };
      },
      providesTags: (_result, _error) => [
        {
          type: "GENERAL",
          id: network.id,
        },
      ],
    }),

    getArmySize: builder.query<string, void>({
      queryFn: async () => {
        const army = await readContract({
          address: network.hillAddress,
          abi: KingOfTheHillABI,
          functionName: "army",
        });

        return {
          data: army.toString(),
        };
      },
      providesTags: (_result, _error) => [
        {
          type: "GENERAL",
          id: network.id,
        },
      ],
    }),

    getDecay: builder.query<string, void>({
      queryFn: async () => {
        const decay = await readContract({
          address: network.hillAddress,
          abi: KingOfTheHillABI,
          functionName: "decay",
        });

        return {
          data: decay.toString(),
        };
      },
      providesTags: (_result, _error) => [
        {
          type: "GENERAL",
          id: network.id,
        },
      ],
    }),

    getStep: builder.query<string, void>({
      queryFn: async () => {
        const step = await readContract({
          address: network.hillAddress,
          abi: KingOfTheHillABI,
          functionName: "step",
        });

        return {
          data: step.toString(),
        };
      },
      providesTags: (_result, _error) => [
        {
          type: "GENERAL",
          id: network.id,
        },
      ],
    }),

    getArmyFlowRate: builder.query<string, void>({
      queryFn: async () => {
        const armyFlowRate = await readContract({
          address: network.hillAddress,
          abi: KingOfTheHillABI,
          functionName: "armyFlowRate",
          args: [BigNumber.from(parseEther("1"))],
        });

        return {
          data: armyFlowRate.toString(),
        };
      },
      providesTags: (_result, _error) => [
        {
          type: "GENERAL",
          id: network.id,
        },
      ],
    }),
  }),
};
