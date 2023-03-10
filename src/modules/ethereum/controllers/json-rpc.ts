import { Response } from 'express';
import { Controller, Post, Body, Res } from '@nestjs/common';
import { EthereumGethService } from '../services/geth';
import { EthereumJsonRpcRequest } from '../services/geth/types/json-rpc';

@Controller('/ethereum/json-rpc')
export class EthereumJsonRpcController {
  constructor(private ethereumGethService: EthereumGethService) {}

  @Post()
  async index(@Body() body: EthereumJsonRpcRequest, @Res() res: Response) {
    const namespace = body.method.split('_')[0];
    if (['eth', 'net', 'web3', 'debug'].indexOf(namespace) !== -1) {
      res.status(200).send(await this.ethereumGethService.request(body));
    } else {
      res.status(400).send(`rpc method namespace "${namespace}" not supported.`);
    }
  }
}
