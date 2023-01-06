import { Controller, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EthereumGethService } from '@/modules/ethereum/services/geth';
import { EthereumGethToMysqlService } from '@/modules/ethereum/services/geth-to-mysql';
import { DINGTALK_BOT_URLS } from '@/constants';
import { firstValueFrom } from 'rxjs';

const DINGTALK_BOT_URL = DINGTALK_BOT_URLS[process.env.DINGTALK_BOT];

interface RequestBody {
  msgtype: string;
  text: {
    content: string;
  };
}

@Controller('/dingtalk/bot')
export class DingTalkBotController {
  constructor(
    private httpService: HttpService,
    private ethereumGethService: EthereumGethService,
    private ethereumGethToMysqlService: EthereumGethToMysqlService,
  ) {}

  // 接收钉钉机器人服务发来的消息
  @Post()
  async index(@Body() body: RequestBody) {
    const { msgtype, text } = body;

    if (msgtype === 'text' && text.content.trim().toLowerCase() === 'syncing') {
      const { currentBlock, highestBlock } =
        await this.ethereumGethService.eth_syncing();

      const blockSyncingProgress = (
        (currentBlock / highestBlock) *
        100
      ).toFixed(1);

      const latestBlockInMysql =
        await this.ethereumGethToMysqlService.getLatestBlockFromMysql();

      // 回复消息
      await firstValueFrom(
        this.httpService.post(DINGTALK_BOT_URL, {
          msgtype: 'text',
          text: {
            content: [
              'eth_syncing',
              '----------------',
              `current block: ${currentBlock} (${blockSyncingProgress}%)`,
              `highest block: ${highestBlock}`,
              `synced to mysql: ${latestBlockInMysql?.block_number || 0}`,
            ].join('\n'),
          },
        }),
      );
    }
  }
}
