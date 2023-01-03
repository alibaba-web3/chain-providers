import { Controller, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GethService } from '@/modules/eth/services/geth';
import { firstValueFrom } from 'rxjs';

@Controller('/dingtalk/command')
export class CommandController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gethService: GethService,
  ) {}

  @Post()
  async index(@Body() body: any) {
    const { msgtype, text } = body;
    if (msgtype === 'text' && text.content.trim() === 'syncing') {
      const { result } = await this.gethService.syncing();
      const currentBlock = parseInt(result.currentBlock);
      const highestBlock = parseInt(result.highestBlock);
      const progress = ((currentBlock / highestBlock) * 100).toFixed(1);
      await firstValueFrom(
        this.httpService.post(
          // prod
          'https://oapi.dingtalk.com/robot/send?access_token=123be05d80c860d8e08690aa2ba71e440d14a141f9a94658c8200714f1593199',
          // test
          // 'https://oapi.dingtalk.com/robot/send?access_token=651b44b935d202b9423b9bcc99e12aca4054caa0caed3a9e7d9d345823b381e4',
          {
            msgtype: 'text',
            text: {
              content: [
                `eth_syncing (${progress}%)`,
                '----------------',
                `currentBlock: ${currentBlock}`,
                `highestBlock: ${highestBlock}`,
              ].join('\n'),
            },
          },
        ),
      );
    }
  }
}
