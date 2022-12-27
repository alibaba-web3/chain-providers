import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export const GETH_HTTP_URL = 'http://localhost:8545';

export interface SyncingResponse {
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
