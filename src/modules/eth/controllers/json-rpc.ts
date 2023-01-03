import { Controller, Get, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GethService, GETH_HTTP_URL } from '../services/geth';
import { firstValueFrom } from 'rxjs';

@Controller('/json-rpc')
export class JsonRpcController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gethService: GethService,
  ) {}

  // 把所有 POST 请求都透传给 Geth
  @Post()
  async index(@Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.post(GETH_HTTP_URL, body),
    );
    return res.data;
  }

  @Get('/syncing')
  syncing() {
    return this.gethService.syncing();
  }
}
