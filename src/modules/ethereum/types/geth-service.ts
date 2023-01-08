export namespace EthereumGethServiceResponse {
  export interface Syncing {
    startingBlock: number;
    currentBlock: number;
    highestBlock: number;
    healedBytecodeBytes: number;
    healedBytecodes: number;
    healedTrienodeBytes: number;
    healedTrienodes: number;
    healingBytecode: number;
    healingTrienodes: number;
    syncedAccountBytes: number;
    syncedAccounts: number;
    syncedBytecodeBytes: number;
    syncedBytecodes: number;
    syncedStorage: number;
    syncedStorageBytes: number;
  }

  export interface Block {
    hash: string;
    parentHash: string;
    sha3Uncles: string;
    miner: string;
    stateRoot: string;
    transactionsRoot: string;
    receiptsRoot: string;
    logsBloom: string;
    difficulty: number;
    number: number;
    gasLimit: number;
    gasUsed: number;
    timestamp: number;
    extraData: string;
    mixHash: string;
    nonce: number;
    totalDifficulty: number;
    baseFeePerGas: number;
    size: number;
    transactions: string[] | Transaction[];
    uncles: string[];
  }

  export interface Transaction {
    blockHash: string;
    blockNumber: number;
    transactionIndex: number;
    type: string;
    nonce: number;
    from: string;
    to: string;
    gas: number;
    value: number;
    input: string;
    gasPrice: number;
    maxPriorityFeePerGas: number;
    maxFeePerGas: number;
    accessList: TransactionAccess[];
    chainId: string;
    yParity: string;
    v: string;
    r: string;
    s: string;
  }

  export interface TransactionReceipt {
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
    from: string;
    to: string;
    cumulativeGasUsed: number;
    gasUsed: number;
    contractAddress: string;
    logs: TransactionLog[];
    logsBloom: string;
    root: string;
    status: number;
    effectiveGasPrice: number;
  }

  export interface TransactionLog {
    removed: boolean;
    logIndex: number;
    transactionIndex: number;
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    address: string;
    data: string;
    topics: string[];
  }

  export interface TransactionAccess {
    address: string;
    storageKeys: string[];
  }
}
