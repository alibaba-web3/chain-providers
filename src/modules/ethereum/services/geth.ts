import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EthereumJsonRpcRequest, EthereumJsonRpcResponse, EthereumJsonRpc } from '../types/json-rpc';

interface Syncing {
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

interface Block {
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

interface Transaction {
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

interface TransactionReceipt {
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

interface TransactionLog {
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

interface TransactionAccess {
  address: string;
  storageKeys: string[];
}

const transformSyncing = (syncing: EthereumJsonRpc.Syncing): Syncing => ({
  startingBlock: parseInt(syncing.startingBlock),
  currentBlock: parseInt(syncing.currentBlock),
  highestBlock: parseInt(syncing.highestBlock),
  healedBytecodeBytes: parseInt(syncing.healedBytecodeBytes),
  healedBytecodes: parseInt(syncing.healedBytecodes),
  healedTrienodeBytes: parseInt(syncing.healedTrienodeBytes),
  healedTrienodes: parseInt(syncing.healedTrienodes),
  healingBytecode: parseInt(syncing.healingBytecode),
  healingTrienodes: parseInt(syncing.healingTrienodes),
  syncedAccountBytes: parseInt(syncing.syncedAccountBytes),
  syncedAccounts: parseInt(syncing.syncedAccounts),
  syncedBytecodeBytes: parseInt(syncing.syncedBytecodeBytes),
  syncedBytecodes: parseInt(syncing.syncedBytecodes),
  syncedStorage: parseInt(syncing.syncedStorage),
  syncedStorageBytes: parseInt(syncing.syncedStorageBytes),
});

const transformBlock = (block: EthereumJsonRpc.Block): Block => ({
  ...block,
  hash: block.hash || '',
  difficulty: block.difficulty ? parseInt(block.difficulty) : 0,
  number: parseInt(block.number),
  gasLimit: parseInt(block.gasLimit),
  gasUsed: parseInt(block.gasUsed),
  timestamp: parseInt(block.timestamp) * 1000,
  nonce: parseInt(block.nonce),
  totalDifficulty: block.totalDifficulty ? parseInt(block.totalDifficulty) : 0,
  baseFeePerGas: block.baseFeePerGas ? parseInt(block.baseFeePerGas) : 0,
  size: parseInt(block.size),
  transactions:
    !block.transactions[0] || typeof block.transactions[0] === 'string'
      ? (block.transactions as string[])
      : (block.transactions as EthereumJsonRpc.Transaction[]).map(transformTransaction),
});

const transformTransaction = (transaction: EthereumJsonRpc.Transaction): Transaction => ({
  ...transaction,
  blockHash: transaction.blockHash || '',
  blockNumber: transaction.blockNumber ? parseInt(transaction.blockNumber) : 0,
  transactionIndex: transaction.transactionIndex ? parseInt(transaction.transactionIndex) : 0,
  nonce: parseInt(transaction.nonce),
  from: transaction.from || '',
  to: transaction.to || '',
  gas: parseInt(transaction.gas),
  value: parseInt(transaction.value),
  gasPrice: (transaction as EthereumJsonRpc.Transaction_legacy).gasPrice
    ? parseInt((transaction as EthereumJsonRpc.Transaction_legacy).gasPrice)
    : 0,
  maxPriorityFeePerGas: (transaction as EthereumJsonRpc.Transaction_1559).maxPriorityFeePerGas
    ? parseInt((transaction as EthereumJsonRpc.Transaction_1559).maxPriorityFeePerGas)
    : 0,
  maxFeePerGas: (transaction as EthereumJsonRpc.Transaction_1559).maxFeePerGas
    ? parseInt((transaction as EthereumJsonRpc.Transaction_1559).maxFeePerGas)
    : 0,
  accessList: (transaction as EthereumJsonRpc.Transaction_1559).accessList,
  chainId: transaction.chainId || '',
  yParity: (transaction as EthereumJsonRpc.Transaction_1559).yParity,
  v: (transaction as EthereumJsonRpc.Transaction_legacy).v || '',
});

const transformTransactionReceipt = (transactionReceipt: EthereumJsonRpc.TransactionReceipt): TransactionReceipt => ({
  ...transactionReceipt,
  transactionIndex: parseInt(transactionReceipt.transactionIndex),
  blockNumber: parseInt(transactionReceipt.blockNumber),
  to: transactionReceipt.to || '',
  cumulativeGasUsed: parseInt(transactionReceipt.cumulativeGasUsed),
  gasUsed: parseInt(transactionReceipt.gasUsed),
  logs: transactionReceipt.logs.map(transformTransactionLog),
  root: transactionReceipt.root || '',
  status: transactionReceipt.status ? parseInt(transactionReceipt.status) : 0,
  effectiveGasPrice: parseInt(transactionReceipt.effectiveGasPrice),
});

const transformTransactionLog = (transactionLog: EthereumJsonRpc.TransactionLog): TransactionLog => ({
  ...transactionLog,
  removed: transactionLog.removed || false,
  logIndex: transactionLog.logIndex ? parseInt(transactionLog.logIndex) : 0,
  transactionIndex: transactionLog.transactionIndex ? parseInt(transactionLog.transactionIndex) : 0,
  blockHash: transactionLog.blockHash || '',
  blockNumber: transactionLog.blockNumber ? parseInt(transactionLog.blockNumber) : 0,
  address: transactionLog.address || '',
  data: transactionLog.data || '',
});

@Injectable()
export class EthereumGethService {
  constructor(private httpService: HttpService) {}

  async request<T>(body: EthereumJsonRpcRequest) {
    const res = await firstValueFrom(
      this.httpService.post(process.env.GETH_HTTP_URL, {
        jsonrpc: '2.0',
        id: Date.now(),
        ...body,
      }),
    );
    return res.data as T;
  }

  async eth_syncing(): Promise<Syncing | boolean> {
    const { result } = await this.request<EthereumJsonRpcResponse.EthSyncing>({
      method: 'eth_syncing',
      params: [],
    });
    if (typeof result === 'boolean') return result;
    return result && transformSyncing(result);
  }

  async eth_getBlockByNumber(blockNumber: number | string = 'latest', hydrated = false): Promise<Block | null> {
    const { result } = await this.request<EthereumJsonRpcResponse.EthGetBlockByNumber>({
      method: 'eth_getBlockByNumber',
      params: [typeof blockNumber === 'number' ? `0x${blockNumber.toString(16)}` : blockNumber, hydrated],
    });
    return result && transformBlock(result);
  }

  async eth_getTransactionByBlockNumberAndIndex(
    blockNumber: number | string = 'latest',
    index: number | string = 0,
  ): Promise<Transaction | null> {
    const { result } = await this.request<EthereumJsonRpcResponse.EthGetTransactionByBlockNumberAndIndex>({
      method: 'eth_getTransactionByBlockNumberAndIndex',
      params: [
        typeof blockNumber === 'number' ? `0x${blockNumber.toString(16)}` : blockNumber,
        typeof index === 'number' ? `0x${index.toString(16)}` : index,
      ],
    });
    return result && transformTransaction(result);
  }

  async eth_getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt | null> {
    const { result } = await this.request<EthereumJsonRpcResponse.EthGetTransactionReceipt>({
      method: 'eth_getTransactionReceipt',
      params: [transactionHash],
    });
    return result && transformTransactionReceipt(result);
  }
}
