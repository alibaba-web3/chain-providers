import { providers, getDefaultProvider, Contract, ContractInterface } from 'ethers';

export const localProvider = new providers.JsonRpcProvider(process.env.GETH_HTTP_URL);

export const remoteProvider = getDefaultProvider('homestead', {
  quorum: 2,
  alchemy: process.env.ALCHEMY_API_KEY, // https://dashboard.alchemy.com/
  infura: process.env.INFURA_API_KEY, // https://app.infura.io/dashboard
  etherscan: process.env.ETHERSCAN_API_KEY, // https://etherscan.io/myapikey
  pocket: process.env.POCKET_API_KEY, // https://www.portal.pokt.network/dashboard/apps
  ankr: process.env.ANKR_API_KEY, // https://www.ankr.com/rpc/
});

export class ContractWithLocalProvider extends Contract {
  constructor(addressOrName: string, contractInterface: ContractInterface) {
    super(addressOrName, contractInterface, localProvider);
  }
}

export class ContractWithRemoteProvider extends Contract {
  constructor(addressOrName: string, contractInterface: ContractInterface) {
    super(addressOrName, contractInterface, remoteProvider);
  }
}
