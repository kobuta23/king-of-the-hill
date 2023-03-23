import * as chain from "wagmi/chains";

const network = {
  ...chain.polygonMumbai,
  rpcUrls: {
    ...chain.polygonMumbai.rpcUrls,
    superfluid: {
      http: ["https://rpc-endpoints.superfluid.dev/polygon-mumbai"],
    },
  },
  subgraphUrl: `https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai`,
  cashToken: "0xb891d8559feb358f4651745aaaBFe97067b3bF81",
  armyToken: "0x6C357412329f9a3EE07017Be93ed0aC551faa77b",
  hillAddress: "0xa4214bE0977f1640C219C81bB1Ab74FC165bd841",
} as const;

export default Object.freeze(network);
