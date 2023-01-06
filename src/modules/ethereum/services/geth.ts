import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface RpcRequest {
  jsonrpc?: '2.0';
  id?: string | number;
  method: string;
  params: any[];
}

export interface RpcResponse<T> {
  jsonrpc: '2.0';
  id: string | number;
  result: T | null;
}

export type RPC_EthSyncingResponse = RpcResponse<{
  currentBlock: string;
  healedBytecodeBytes: string;
  healedBytecodes: string;
  healedTrienodeBytes: string;
  healedTrienodes: string;
  healingBytecode: string;
  healingTrienodes: string;
  highestBlock: string;
  startingBlock: string;
  syncedAccountBytes: string;
  syncedAccounts: string;
  syncedBytecodeBytes: string;
  syncedBytecodes: string;
  syncedStorage: string;
  syncedStorageBytes: string;
}>;

export type RPC_EthGetBlockByNumberResponse = RpcResponse<{
  baseFeePerGas?: string;
  difficulty: string;
  extraData: string;
  gasLimit: string;
  gasUsed: string;
  hash: string;
  logsBloom: string;
  miner: string;
  mixHash: string;
  nonce: string;
  number: string;
  parentHash: string;
  receiptsRoot: string;
  sha3Uncles: string;
  size: string;
  stateRoot: string;
  timestamp: string;
  totalDifficulty: string;
  transactions: any[];
  transactionsRoot: string;
  uncles: any[];
}>;

export interface EthGetBlockByNumberResponse {
  baseFeePerGas?: number;
  difficulty: number;
  extraData: string;
  gasLimit: number;
  gasUsed: number;
  hash: string;
  logsBloom: string;
  miner: string;
  mixHash: string;
  nonce: number;
  number: number;
  parentHash: string;
  receiptsRoot: string;
  sha3Uncles: string;
  size: number;
  stateRoot: string;
  timestamp: number;
  totalDifficulty: number;
  transactions: any[];
  transactionsRoot: string;
  uncles: any[];
}

@Injectable()
export class EthereumGethService {
  constructor(private httpService: HttpService) {}

  async request<T>(body: RpcRequest) {
    const res = await firstValueFrom(
      this.httpService.post<T>(process.env.GETH_HTTP_URL, {
        jsonrpc: '2.0',
        id: Date.now(),
        ...body,
      }),
    );
    return res.data;
  }

  eth_syncing() {
    return this.request<RPC_EthSyncingResponse>({
      method: 'eth_syncing',
      params: [],
    });
  }

  async eth_getBlockByNumber(
    blockNumber: number | string = 'latest',
    hydrated = false,
  ): Promise<EthGetBlockByNumberResponse> {
    const { result } = await this.request<RPC_EthGetBlockByNumberResponse>({
      method: 'eth_getBlockByNumber',
      params: [
        typeof blockNumber === 'number'
          ? `0x${blockNumber.toString(16)}`
          : blockNumber,
        hydrated,
      ],
    });
    return (
      result && {
        ...result,
        baseFeePerGas: parseInt(result.baseFeePerGas),
        difficulty: parseInt(result.difficulty),
        gasLimit: parseInt(result.gasLimit),
        gasUsed: parseInt(result.gasUsed),
        nonce: parseInt(result.nonce),
        number: parseInt(result.number),
        size: parseInt(result.size),
        timestamp: parseInt(result.timestamp) * 1000,
        totalDifficulty: parseInt(result.totalDifficulty),
      }
    );
  }
}
