import { Response } from 'express';
import { Controller, Post, Body, Res } from '@nestjs/common';
import { EthereumGethService } from '../services/geth';
import { EthereumJsonRpcRequest } from '../types/json-rpc';

@Controller('/ethereum/json-rpc')
export class EthereumJsonRpcController {
  constructor(private ethereumGethService: EthereumGethService) {}

  @Post()
  index(@Body() body: EthereumJsonRpcRequest, @Res() res: Response) {
    const namespace = body.method.split('_')[0];
    if (['eth', 'net', 'web3'].indexOf(namespace) === -1) {
      return res.status(400).send(`rpc method namespace "${namespace}" not supported.`);
    }
    return this.ethereumGethService.request(body);
  }
}
