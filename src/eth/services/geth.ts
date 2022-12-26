import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export const GETH_HTTP_URL = 'http://localhost:8545';

export interface SyncingResponse {
  currentBlock: number;
  healedBytecodeBytes: number;
  healedBytecodes: number;
  healedTrienodeBytes: number;
  healedTrienodes: number;
  healingBytecode: number;
  healingTrienodes: number;
  highestBlock: number;
  startingBlock: number;
  syncedAccountBytes: number;
  syncedAccounts: number;
  syncedBytecodeBytes: number;
  syncedBytecodes: number;
  syncedStorage: number;
  syncedStorageBytes: number;
}

@Injectable()
export class GethService {
  constructor(private readonly httpService: HttpService) {}

  async syncing(): Promise<SyncingResponse> {
    const res = await firstValueFrom(
      this.httpService.post<SyncingResponse>(GETH_HTTP_URL, {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_syncing',
        params: [],
      }),
    );
    return res.data;
  }
}
