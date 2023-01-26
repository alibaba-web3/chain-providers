import { Controller, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EthereumGethService } from '@/modules/ethereum/services/geth';
import { EthereumSyncGethToMysqlService_blocks } from '@/modules/ethereum/services/sync-to-mysql/blocks';
import { EthereumSyncGethToMysqlService_transactions } from '@/modules/ethereum/services/sync-to-mysql/transactions';
import { EthereumSyncGethToMysqlService_logs } from '@/modules/ethereum/services/sync-to-mysql/logs';
import { EthereumSyncGethToMysqlService_traces } from '@/modules/ethereum/services/sync-to-mysql/traces';
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
    private ethereumSyncGethToMysqlService_blocks: EthereumSyncGethToMysqlService_blocks,
    private ethereumSyncGethToMysqlService_transactions: EthereumSyncGethToMysqlService_transactions,
    private ethereumSyncGethToMysqlService_logs: EthereumSyncGethToMysqlService_logs,
    private ethereumSyncGethToMysqlService_traces: EthereumSyncGethToMysqlService_traces,
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
          this.ethereumSyncGethToMysqlService_blocks.getLatestBlockFromMysql(),
          this.ethereumSyncGethToMysqlService_transactions.getLatestTransactionFromMysql(),
          this.ethereumSyncGethToMysqlService_logs.getLatestLogFromMysql(),
          this.ethereumSyncGethToMysqlService_traces.getLatestTraceFromMysql(),
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
