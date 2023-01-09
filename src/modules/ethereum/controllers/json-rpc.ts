import { Controller, Post, Body } from '@nestjs/common';
import { EthereumGethService } from '../services/geth';
import { EthereumJsonRpcRequest } from '../types/json-rpc';

@Controller('/ethereum/json-rpc')
export class EthereumJsonRpcController {
  constructor(private ethereumGethService: EthereumGethService) {}

  @Post()
  index(@Body() body: EthereumJsonRpcRequest) {
    return this.ethereumGethService.request(body);
  }
}
