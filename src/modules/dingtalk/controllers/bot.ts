import { Controller, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EthereumGethService } from '@/modules/ethereum/services/geth';
import { EthereumGethToMysqlService } from '@/modules/ethereum/services/geth-to-mysql';
import { DingTalkBotUrls } from '@/constants';
import { firstValueFrom } from 'rxjs';

interface MessageBody {
  msgId: string;
  msgtype: string;
  text: { content: string };
  senderId: string;
  senderNick: string;
  isAdmin: boolean;
  conversationId: string;
  conversationTitle: string;
  conversationType: string;
  atUsers: { dingtalkId: string }[];
  isInAtList: boolean;
  chatbotUserId: string;
  robotCode: string;
  createAt: number;
  sessionWebhook: string;
  sessionWebhookExpiredTime: number;
}

@Controller('/dingtalk/bot')
export class DingTalkBotController {
  constructor(
    private httpService: HttpService,
    private ethereumGethService: EthereumGethService,
    private ethereumGethToMysqlService: EthereumGethToMysqlService,
  ) {}

  sendText(url: string, content: string): Promise<any> {
    return firstValueFrom(this.httpService.post(url, { msgtype: 'text', text: { content } }));
  }

  @Post()
  async index(@Body() body: MessageBody) {
    const { conversationId, msgtype, text } = body;
    const url = DingTalkBotUrls[conversationId];
    if (!url) return console.log('[dingtalk/bot] conversation id not in whitelist. message body:', body);
    if (msgtype === 'text' && text.content.trim().toLowerCase() === 'syncing') {
      const syncing = await this.ethereumGethService.eth_syncing();
      if (typeof syncing === 'boolean') {
        await this.sendText(url, ['eth_syncing', '----------------', syncing.toString()].join('\n'));
      } else {
        const { currentBlock, highestBlock } = syncing;
        const gethBlockSyncingProgress = ((currentBlock / highestBlock) * 100).toFixed(1);
        const latestBlockInMysql = await this.ethereumGethToMysqlService.getLatestBlockFromMysql();
        const latestTransactionInMysql = await this.ethereumGethToMysqlService.getLatestTransactionFromMysql();
        const latestLogInMysql = await this.ethereumGethToMysqlService.getLatestLogFromMysql();
        const mysqlBlockSyncingProgress = (((latestBlockInMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
        const mysqlTransactionSyncingProgress = (((latestTransactionInMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
        const mysqlLogSyncingProgress = (((latestLogInMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
        await this.sendText(
          url,
          [
            'eth_syncing',
            '- - - - - - - - - - - - - - -',
            `current_block: ${currentBlock} (${gethBlockSyncingProgress}%)`,
            `highest_block: ${highestBlock}`,
            '\nmysql_syncing',
            '- - - - - - - - - - - - - - -',
            `blocks: ${mysqlBlockSyncingProgress}%`,
            `transactions: ${mysqlTransactionSyncingProgress}%`,
            `logs: ${mysqlLogSyncingProgress}%`,
          ].join('\n'),
        );
      }
    }
  }
}
