// Ethereum JSON-RPC Specification
// https://ethereum.github.io/execution-apis/api-documentation/

// 字段 not spec 代表规范没有，但 geth 返回了

interface ResponseWrap<T> {
  jsonrpc: '2.0';
  id: string | number;
  result: T | null;
}

export interface EthereumJsonRpcRequest {
  jsonrpc?: '2.0';
  id?: string | number;
  method: string;
  params: any[];
}

export namespace EthereumJsonRpcResponse {
  export type EthSyncing = ResponseWrap<EthereumJsonRpc.Syncing | boolean>;
  export type EthBlockNumber = ResponseWrap<string>;
  export type EthGetBlockByNumber = ResponseWrap<EthereumJsonRpc.Block>;
  export type EthGetBlockTransactionCountByHash = ResponseWrap<string>;
  export type EthGetBlockTransactionCountByNumber = ResponseWrap<string>;
  export type EthGetTransactionByBlockNumberAndIndex = ResponseWrap<EthereumJsonRpc.Transaction>;
  export type EthGetTransactionReceipt = ResponseWrap<EthereumJsonRpc.TransactionReceipt>;
  export type NetPeerCount = ResponseWrap<string>;
  export type DebugTraceTransaction = ResponseWrap<EthereumJsonRpc.TraceTransaction>;
}

export namespace EthereumJsonRpc {
  export interface Syncing {
    startingBlock: string;
    currentBlock: string;
    highestBlock: string;
    healedBytecodeBytes?: string; // not spec
    healedBytecodes?: string; // not spec
    healedTrienodeBytes?: string; // not spec
    healedTrienodes?: string; // not spec
    healingBytecode?: string; // not spec
    healingTrienodes?: string; // not spec
    syncedAccountBytes?: string; // not spec
    syncedAccounts?: string; // not spec
    syncedBytecodeBytes?: string; // not spec
    syncedBytecodes?: string; // not spec
    syncedStorage?: string; // not spec
    syncedStorageBytes?: string; // not spec
  }

  export interface Block {
    hash?: string; // not spec
    parentHash: string;
    sha3Uncles: string;
    miner: string;
    stateRoot: string;
    transactionsRoot: string;
    receiptsRoot: string;
    logsBloom: string;
    difficulty?: string;
    number: string;
    gasLimit: string;
    gasUsed: string;
    timestamp: string;
    extraData: string;
    mixHash: string;
    nonce: string;
    totalDifficulty?: string;
    baseFeePerGas?: string;
    size: string;
    transactions: string[] | Transaction[];
    uncles: string[];
  }

  export type Transaction = Transaction_legacy | Transaction_1559 | Transaction_2930;

  export interface Transaction_legacy {
    hash?: string; // not spec
    blockHash?: string; // not spec
    blockNumber?: string; // not spec
    transactionIndex?: string; // not spec
    type: string;
    nonce: string;
    from?: string; // not spec
    to?: string;
    gas: string;
    value: string;
    input: string;
    gasPrice: string;
    chainId?: string;
    v: string;
    r: string;
    s: string;
  }

  export interface Transaction_1559 {
    hash?: string; // not spec
    blockHash?: string; // not spec
    blockNumber?: string; // not spec
    transactionIndex?: string; // not spec
    type: string;
    nonce: string;
    from?: string; // not spec
    to?: string;
    gas: string;
    value: string;
    input: string;
    maxPriorityFeePerGas: string;
    maxFeePerGas: string;
    accessList: TransactionAccess[];
    chainId: string;
    yParity: string;
    r: string;
    s: string;
  }

  export interface Transaction_2930 {
    hash?: string; // not spec
    blockHash?: string; // not spec
    blockNumber?: string; // not spec
    transactionIndex?: string; // not spec
    type: string;
    nonce: string;
    from?: string; // not spec
    to?: string;
    gas: string;
    value: string;
    input: string;
    gasPrice: string;
    accessList: TransactionAccess[];
    chainId: string;
    yParity: string;
    r: string;
    s: string;
  }

  export interface TransactionReceipt {
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    blockNumber: string;
    from: string;
    to?: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    contractAddress: string | null;
    logs: TransactionLog[];
    logsBloom: string;
    root?: string;
    status?: string;
    effectiveGasPrice: string;
  }

  export interface TransactionLog {
    removed?: boolean;
    logIndex?: string;
    transactionIndex?: string;
    transactionHash: string;
    blockHash?: string;
    blockNumber?: string;
    address?: string;
    data?: string;
    topics: string[];
  }

  export interface TransactionAccess {
    address: string;
    storageKeys: string[];
  }

  export interface TraceTransaction {
    type: 'CALL' | 'STATICCALL' | 'DELEGATECALL' | 'CREATE';
    from: string;
    to: string;
    value?: string;
    gas: string;
    gasUsed: string;
    input: string;
    output: string;
    error?: string;
    revertReason?: string;
    calls?: TraceTransaction[];
  }
}
