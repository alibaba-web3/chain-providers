import { Controller, Post, Body } from '@nestjs/common';
import { BitcoinCoreService } from '../services/bitcoin-core';
import { BitcoinJsonRpcRequest } from '../types/json-rpc';

@Controller('/bitcoin/json-rpc')
export class BitcoinJsonRpcController {
  constructor(private bitcoinCoreService: BitcoinCoreService) {}

  @Post()
  async index(@Body() body: BitcoinJsonRpcRequest) {
    return await this.bitcoinCoreService.request(body);
  }
}
