export interface ERC20Contract {
  contractAddress: string;
  creationTransactionHash: string | null;
  isStable: boolean;
}

// 获取 creationTransactionHash
// https://etherscan.io/txs?a={contractAddress}&f=5

export const erc20Contracts: ERC20Contract[] = [
  // USDT
  {
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    creationTransactionHash: '0x2f1c5c2b44f771e942a8506148e256f94f1a464babc938ae0690c6e34cd79190',
    isStable: true,
  },
  // USDC
  {
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    creationTransactionHash: '0xe7e0fe390354509cd08c9a0168536938600ddc552b3f7cb96030ebef62e75895',
    isStable: true,
  },
  // DAI
  // {
  //   contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
  //   creationTransactionHash: null,
  //   isStable: true,
  // },
  // WBTC
  {
    contractAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    creationTransactionHash: '0xdaaa0b08e0fa932ebf1ebc9ed2de9a6eb4db3f03c77e9ed937d9c9a3a49e2b81',
    isStable: false,
  },
  // WETH
  {
    contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    creationTransactionHash: '0xb95343413e459a0f97461812111254163ae53467855c0d73e0f1e7c5b8442fa3',
    isStable: false,
  },
  // UNI
  {
    contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    creationTransactionHash: '0x4b37d2f343608457ca3322accdab2811c707acf3eb07a40dd8d9567093ea5b82',
    isStable: false,
  },
  // SHIB
  {
    contractAddress: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
    creationTransactionHash: '0x0a4022e61c49c59b2538b78a6c7c9a0e4bb8c8fce2d1b4a725baef3c55fb7363',
    isStable: false,
  },
  // APE
  {
    contractAddress: '0x4d224452801aced8b2f0aebe155379bb5d594381',
    creationTransactionHash: '0x2761f74e2f45d981a9d7553cbbcfbcc862cae416eb37a820300d4c19516d6fca',
    isStable: false,
  },
  // PEOPLE
  // {
  //   contractAddress: '0x7a58c0be72be218b41c608b7fe7c5bb630736c71',
  //   creationTransactionHash: null,
  //   isStable: false,
  // },
  // MASK
  {
    contractAddress: '0x69af81e73a73b40adf4f3d4223cd9b1ece623074',
    creationTransactionHash: '0x232d0236500d762f68fa63a7397cdf940eb70e071e46fe0351130c9d4fe9f3b0',
    isStable: false,
  },
  // ENS
  {
    contractAddress: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72',
    creationTransactionHash: '0xdfc76788b13ab1c033c7cd55fdb7a431b2bc8abe6b19ac9f7d22f4105bb43bff',
    isStable: false,
  },
  // AAVE
  {
    contractAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    creationTransactionHash: '0xfd5f0c65fdea26d0b94362532554d4c6cb4935b198d75e1cc07c7df4bfd8d1ad',
    isStable: false,
  },
];
