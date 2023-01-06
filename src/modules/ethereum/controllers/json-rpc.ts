import { Controller, Post, Body } from '@nestjs/common';
import { EthereumGethService, RpcRequest } from '../services/geth';

@Controller('/ethereum/json-rpc')
export class EthereumJsonRpcController {
  constructor(private ethereumGethService: EthereumGethService) {}

  @Post()
  index(@Body() body: RpcRequest) {
    return this.ethereumGethService.request(body);
  }
}
