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

  sendText(content: string): Promise<any> {
    return firstValueFrom(this.httpService.post(DINGTALK_BOT_URL, { msgtype: 'text', text: { content } }));
  }

  @Post()
  async index(@Body() body: RequestBody) {
    console.log('/dingtalk/bot body:', body);
    const { msgtype, text } = body;
    if (msgtype === 'text' && text.content.trim().toLowerCase() === 'syncing') {
      const syncing = await this.ethereumGethService.eth_syncing();
      if (typeof syncing === 'boolean') {
        await this.sendText(['eth_syncing', '----------------', syncing.toString()].join('\n'));
      } else {
        const { currentBlock, highestBlock } = syncing;
        const gethBlockSyncingProgress = ((currentBlock / highestBlock) * 100).toFixed(1);
        const latestBlockInMysql = await this.ethereumGethToMysqlService.getLatestBlockFromMysql();
        const latestTransactionInMysql = await this.ethereumGethToMysqlService.getLatestTransactionFromMysql();
        const mysqlBlockSyncingProgress = (((latestBlockInMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
        const mysqlTransactionSyncingProgress = (((latestTransactionInMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
        await this.sendText(
          [
            'eth_syncing',
            '- - - - - - - - - - - - - - -',
            `current block: ${currentBlock} (${gethBlockSyncingProgress}%)`,
            `highest block: ${highestBlock}`,
            '\nmysql_syncing',
            '- - - - - - - - - - - - - - -',
            `blocks: ${mysqlBlockSyncingProgress}%`,
            `transactions: ${mysqlTransactionSyncingProgress}%`,
          ].join('\n'),
        );
      }
    }
  }
}
