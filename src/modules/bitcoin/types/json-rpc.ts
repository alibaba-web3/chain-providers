// Bitcoin JSON-RPC Reference
// https://developer.bitcoin.org/reference/rpc/index.html

interface ResponseWrap<T> {
  id: string | number;
  result: T | null;
  error: string | null;
}

export interface BitcoinJsonRpcRequest {
  id?: string | number;
  method: string;
  params?: any[];
}

export namespace BitcoinJsonRpcResponse {
  export type GetBlockchainInfo = ResponseWrap<BitcoinJsonRpc.BlockchainInfo>;
  export type GetConnectionCount = ResponseWrap<number>;
}

export namespace BitcoinJsonRpc {
  export interface BlockchainInfo {
    chain: string;
    blocks: number;
    headers: number;
    bestblockhash: string;
    difficulty: number;
    time: number;
    mediantime: number;
    verificationprogress: number;
    initialblockdownload: boolean;
    chainwork: string;
    size_on_disk: number;
    pruned: boolean;
    warnings: string;
  }
}
