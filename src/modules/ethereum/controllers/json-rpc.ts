import { Response } from 'express';
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { EthereumGethService } from '../services/geth';
import { EthereumJsonRpcRequest } from '../types/json-rpc';

@Controller('/ethereum/json-rpc')
export class EthereumJsonRpcController {
  constructor(private ethereumGethService: EthereumGethService) {
  }

  @Post()
  async index(@Body() body: EthereumJsonRpcRequest, @Res() res: Response) {
    const namespace = body.method.split('_')[0];
    if (['eth', 'net', 'web3'].indexOf(namespace) !== -1) {
      res.status(200).send(await this.ethereumGethService.request(body));
    } else {
      res.status(400).send(`rpc method namespace "${namespace}" not supported.`);
    }
  }

  @Get('/block')
  async getBlockByNumber(@Query('number') number: string, @Res() res: Response) {
    const block = await this.ethereumGethService.eth_getBlockByNumber(Number(number), true);
    res.status(200).send(block);
  }

}
