import * as chain from "wagmi/chains";

const network = {
  ...chain.polygonMumbai,
  rpcUrls: {
    ...chain.polygonMumbai.rpcUrls,
    alchemy: {
      http: [
        "https://polygon-mumbai.g.alchemy.com/v2/alRa1D4oh5918OM3zmfCark4vdYjMbas",
      ],
    },
  },
  subgraphUrl: `https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai`,
  cashToken: "0xb891d8559feb358f4651745aaaBFe97067b3bF81",
  armyToken: "0x6C357412329f9a3EE07017Be93ed0aC551faa77b",
  hillAddress: "0x75ef7C347652f3a4232a0C6f6b9b26492E2E0A94",
} as const;

export default Object.freeze(network);
