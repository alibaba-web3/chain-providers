import { Injectable } from '@nestjs/common';
import { BitcoinJsonRpcRequest, BitcoinJsonRpcResponse } from '../types/json-rpc';
import { request } from '@/utils';

@Injectable()
export class BitcoinCoreService {
  request<T>(body: BitcoinJsonRpcRequest) {
    return request<T>(process.env.BITCOIN_HTTP_URL, {
      data: {
        id: Date.now(),
        ...body,
      },
      timeout: 20 * 60 * 1000,
    });
  }

  async getBlockchainInfo() {
    const { result } = await this.request<BitcoinJsonRpcResponse.GetBlockchainInfo>({
      method: 'getblockchaininfo',
    });
    return result;
  }

  async getConnectionCount() {
    const { result } = await this.request<BitcoinJsonRpcResponse.GetConnectionCount>({
      method: 'getconnectioncount',
    });
    return result;
  }
}
