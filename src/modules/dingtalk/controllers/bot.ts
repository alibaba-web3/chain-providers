import { Controller, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EthereumGethService } from '@/modules/ethereum/services/geth';
import { DINGTALK_BOT_URLS } from '@/constants';
import { firstValueFrom } from 'rxjs';

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
  ) {}

  // 接收钉钉机器人服务发来的消息
  @Post()
  async index(@Body() body: RequestBody) {
    const { msgtype, text } = body;
    if (msgtype === 'text' && text.content.trim().toLowerCase() === 'syncing') {
      // 获取数据
      const { result } = await this.ethereumGethService.eth_syncing();
      const currentBlock = parseInt(result.currentBlock);
      const highestBlock = parseInt(result.highestBlock);
      const progress = ((currentBlock / highestBlock) * 100).toFixed(1);

      // 回复消息
      await firstValueFrom(
        this.httpService.post(DINGTALK_BOT_URLS.PROD, {
          msgtype: 'text',
          text: {
            content: [
              `eth_syncing (${progress}%)`,
              '----------------',
              `currentBlock: ${currentBlock}`,
              `highestBlock: ${highestBlock}`,
            ].join('\n'),
          },
        }),
      );
    }
  }
}
