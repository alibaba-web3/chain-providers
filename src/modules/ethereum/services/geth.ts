import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ETHEREUM_GETH_HTTP_URL } from '@/constants';
import { firstValueFrom } from 'rxjs';

export interface RequestBody {
  id: string | number;
  jsonrpc: string;
  method: string;
  params: any[];
}

export interface EthSyncingResponse {
  result: {
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
  };
}

@Injectable()
export class EthereumGethService {
  constructor(private httpService: HttpService) {}

  async request<T>(body: RequestBody) {
    const res = await firstValueFrom(
      this.httpService.post<T>(ETHEREUM_GETH_HTTP_URL, body),
    );
    return res.data;
  }

  eth_syncing() {
    return this.request<EthSyncingResponse>({
      id: Date.now(),
      jsonrpc: '2.0',
      method: 'eth_syncing',
      params: [],
    });
  }
}
