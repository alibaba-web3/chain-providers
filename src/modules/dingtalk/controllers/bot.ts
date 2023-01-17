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
      const [peerCount, syncing, currentBlockNumber, latestBlockInMysql, latestTransactionInMysql, latestLogInMysql, latestTraceFromMysql] =
        await Promise.all([
          this.ethereumGethService.net_peerCount(),
          this.ethereumGethService.eth_syncing(),
          this.ethereumGethService.eth_blockNumber(),
          this.ethereumGethToMysqlService.getLatestBlockFromMysql(),
          this.ethereumGethToMysqlService.getLatestTransactionFromMysql(),
          this.ethereumGethToMysqlService.getLatestLogFromMysql(),
          this.ethereumGethToMysqlService.getLatestTraceFromMysql(),
        ]);
      const texts = [];
      texts.push(`eth_syncing (peers: ${peerCount})`);
      texts.push('- - - - - - - - - - - - - - -');
      if (typeof syncing === 'boolean') {
        texts.push(syncing.toString());
      } else {
        const gethBlockSyncingProgress = ((syncing.currentBlock / syncing.highestBlock) * 100).toFixed(1);
        texts.push(`current_block: ${syncing.currentBlock} (${gethBlockSyncingProgress}%)`);
        texts.push(`highest_block: ${syncing.highestBlock}`);
      }
      texts.push('\nmysql_syncing');
      texts.push('- - - - - - - - - - - - - - -');
      const highestBlock = typeof syncing === 'boolean' ? currentBlockNumber : syncing.highestBlock;
      const mysqlBlockSyncingProgress = (((latestBlockInMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
      const mysqlTransactionSyncingProgress = (((latestTransactionInMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
      const mysqlLogSyncingProgress = (((latestLogInMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
      const mysqlTraceSyncingProgress = (((latestTraceFromMysql?.block_number || 0) / highestBlock) * 100).toFixed(1);
      texts.push(`blocks: ${mysqlBlockSyncingProgress}%`);
      texts.push(`transactions: ${mysqlTransactionSyncingProgress}%`);
      texts.push(`logs: ${mysqlLogSyncingProgress}%`);
      texts.push(`traces: ${mysqlTraceSyncingProgress}%`);
      await this.sendText(url, texts.join('\n'));
    }
  }
}
