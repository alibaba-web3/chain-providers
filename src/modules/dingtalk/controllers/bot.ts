import { Controller, Post, Body } from '@nestjs/common';
import { DingTalkSendService } from '../services/send';
import { BitcoinCoreService } from '@/modules/bitcoin/services/bitcoin-core';
import { EthereumGethService } from '@/modules/ethereum/services/geth';
import { EthereumGethSyncService_blocks } from '@/modules/ethereum/services/geth/sync-blocks';
import { EthereumGethSyncService_transactions } from '@/modules/ethereum/services/geth/sync-transactions';
import { EthereumGethSyncService_logs } from '@/modules/ethereum/services/geth/sync-logs';
import { EthereumGethSyncService_traces } from '@/modules/ethereum/services/geth/sync-traces';
import { dingTalkBotUrls } from '@/constants';

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
    private dingTalkSendService: DingTalkSendService,
    private bitcoinCoreService: BitcoinCoreService,
    private ethereumGethService: EthereumGethService,
    private ethereumGethSyncService_blocks: EthereumGethSyncService_blocks,
    private ethereumGethSyncService_transactions: EthereumGethSyncService_transactions,
    private ethereumGethSyncService_logs: EthereumGethSyncService_logs,
    private ethereumGethSyncService_traces: EthereumGethSyncService_traces,
  ) {}

  @Post()
  index(@Body() body: MessageBody) {
    const { conversationId, msgtype, text } = body;
    const url = dingTalkBotUrls[conversationId];
    if (url) {
      console.log(`[dingtalk/bot] receive message. conversation id: "${conversationId}". body:`, body);
    } else {
      return console.log('[dingtalk/bot] conversation id not in whitelist. body:', body);
    }
    const command = msgtype === 'text' && text.content.trim().toLowerCase();
    if (command === 'hi') this.dingTalkSendService.sendText(url, 'hello');
    if (command === 'bitcoin') this.bitcoin(url);
    if (command === 'syncing') this.syncing(url);
  }

  async bitcoin(url: string) {
    const [blockchainInfo, connectionCount] = await Promise.all([
      this.bitcoinCoreService.getBlockchainInfo(),
      this.bitcoinCoreService.getConnectionCount(),
    ]);
    const texts = [];
    texts.push(`bitcoin (peers: ${connectionCount})`);
    texts.push('- - - - - - - - - - - - - - -');
    const syncingProgress = ((blockchainInfo.blocks / blockchainInfo.headers) * 100).toFixed(1);
    texts.push(`current_block: ${blockchainInfo.blocks} (${syncingProgress}%)`);
    texts.push(`highest_block: ${blockchainInfo.headers}`);
    this.dingTalkSendService.sendText(url, texts.join('\n'));
  }

  async syncing(url: string) {
    const [peerCount, syncing, currentBlockNumber, latestBlockInMysql, latestTransactionInMysql, latestLogInMysql, latestTraceFromMysql] =
      await Promise.all([
        this.ethereumGethService.net_peerCount(),
        this.ethereumGethService.eth_syncing(),
        this.ethereumGethService.eth_blockNumber(),
        this.ethereumGethSyncService_blocks.getLatestBlockFromMysql(),
        this.ethereumGethSyncService_transactions.getLatestTransactionFromMysql(),
        this.ethereumGethSyncService_logs.getLatestLogFromMysql(),
        this.ethereumGethSyncService_traces.getLatestTraceFromMysql(),
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
    this.dingTalkSendService.sendText(url, texts.join('\n'));
  }
}
