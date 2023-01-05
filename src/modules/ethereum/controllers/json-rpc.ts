import { Controller, Post, Body } from '@nestjs/common';
import { EthereumGethService, RequestBody } from '../services/geth';

@Controller('/ethereum/json-rpc')
export class EthereumJsonRpcController {
  constructor(private ethereumGethService: EthereumGethService) {}

  @Post()
  index(@Body() body: RequestBody) {
    return this.ethereumGethService.request(body);
  }
}
