import { ethers, ContractInterface } from 'ethers';

// https://docs.ethers.org/v5/api/providers/#providers-getDefaultProvider
export const provider = ethers.getDefaultProvider('homestead', {
  quorum: 2,
  alchemy: process.env.ALCHEMY_API_KEY, // https://dashboard.alchemy.com/
  infura: process.env.INFURA_API_KEY, // https://app.infura.io/dashboard
  etherscan: process.env.ETHERSCAN_API_KEY, // https://etherscan.io/myapikey
  pocket: process.env.POCKET_API_KEY, // https://www.portal.pokt.network/dashboard/apps
  ankr: process.env.ANKR_API_KEY, // https://www.ankr.com/rpc/
});

export class ContractWithProvider extends ethers.Contract {
  constructor(addressOrName: string, contractInterface: ContractInterface) {
    super(addressOrName, contractInterface, provider);
  }
}
