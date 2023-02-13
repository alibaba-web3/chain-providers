import { Injectable } from '@nestjs/common';
import { Timeout, Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumSyncGethToMysqlService_logs } from '@/modules/ethereum/services/sync-to-mysql/logs';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumERC20EventApproval } from '@/entities/ethereum-erc20-event-approval';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { isDev, isProd, syncRestartTime } from '@/constants';
import { debug } from '@/utils';
import { ethers, BigNumber } from 'ethers';

@Injectable()
export class EthereumERC20Service_event_approval {
  constructor(
    @InjectRepository(EthereumERC20)
    private ethereumERC20Repository: Repository<EthereumERC20>,
    @InjectRepository(EthereumERC20EventApproval)
    private ethereumERC20EventApprovalRepository: Repository<EthereumERC20EventApproval>,
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
    @InjectRepository(EthereumLogs)
    private ethereumLogsRepository: Repository<EthereumLogs>,
    private ethereumSyncGethToMysqlService_logs: EthereumSyncGethToMysqlService_logs,
    private dingTalkSendService: DingTalkSendService,
  ) {}

  // 记录 ethereum_logs 表的同步进度
  private latestLogBlockNumber: number;

  @Timeout(0)
  @Cron(CronExpression.EVERY_HOUR)
  async main() {
    if (isDev) return;
    const [latestLog, tokens] = await Promise.all([
      this.ethereumSyncGethToMysqlService_logs.getLatestLogFromMysql(),
      this.ethereumERC20Repository.find(),
    ]);
    this.latestLogBlockNumber = latestLog.block_number;
    tokens.forEach(({ symbol, contract_address, creation_transaction_hash }) => {
      this.syncApprovalEvents(contract_address, creation_transaction_hash);
      console.log(`start sync erc20 approval events (symbol: ${symbol})`);
    });
    console.log(`tokens count: ${tokens.length}`);
  }

  async syncApprovalEvents(contractAddress: string, creationTransactionHash: string) {
    const event = await this.getLatestApprovalEventFromMysql(contractAddress);
    if (event) {
      // 由于除了主键，没有其它能标识唯一行的字段，所以先删掉整个区块的数据再重新 insert 而不是 upsert
      await this.ethereumERC20EventApprovalRepository.delete({
        contract_address: contractAddress,
        block_number: event.block_number,
      });
      this.syncApprovalEventsFromBlockNumber(contractAddress, event.block_number);
    } else {
      const creationTransaction = await this.ethereumTransactionsRepository.findOneBy({
        transaction_hash: creationTransactionHash,
      });
      if (creationTransaction) {
        this.syncApprovalEventsFromBlockNumber(contractAddress, creationTransaction.block_number);
      } else {
        console.log(`creationTransaction not found (hash: ${creationTransactionHash})`);
      }
    }
  }

  async getLatestApprovalEventFromMysql(contractAddress: string) {
    const [event] = await this.ethereumERC20EventApprovalRepository.find({
      where: { contract_address: contractAddress },
      order: { block_number: 'DESC' },
      take: 1,
    });
    return event;
  }

  // 推荐阅读：理解以太坊的 event logs
  // https://medium.com/mycrypto/understanding-event-logs-on-the-ethereum-blockchain-f4ae7ba50378
  async syncApprovalEventsFromBlockNumber(contractAddress: string, blockNumber: number) {
    if (blockNumber >= this.latestLogBlockNumber) {
      // 没有数据了，等一段时间后有新的数据了再重新开始
      return setTimeout(async () => {
        const latestLog = await this.ethereumSyncGethToMysqlService_logs.getLatestLogFromMysql();
        this.latestLogBlockNumber = latestLog.block_number;
        this.syncApprovalEventsFromBlockNumber(contractAddress, blockNumber);
      }, syncRestartTime);
    }
    try {
      const logs = await this.ethereumLogsRepository.findBy({
        contract_address: contractAddress,
        block_number: blockNumber,
        topic_1: ethers.utils.id('Approval(address,address,uint256)'),
      });
      if (logs.length > 0) {
        const eventEntities = logs.map((log) => ({
          contract_address: log.contract_address,
          from: `0x${log.topic_2.slice(-40)}`,
          to: `0x${log.topic_3.slice(-40)}`,
          value: BigNumber.from(log.data),
          block_number: log.block_number,
          block_timestamp: log.block_timestamp,
          transaction_index: log.transaction_index,
          transaction_hash: log.transaction_hash,
          log_index: log.log_index,
        }));
        await this.ethereumERC20EventApprovalRepository.insert(eventEntities);
        debug(`sync erc20 approval events (contract: ${contractAddress}, block: ${blockNumber}, event count: ${eventEntities.length}) success 🎉`);
      }
    } catch (e) {
      const errorMessage = `sync erc20 approval events (contract: ${contractAddress}, block: ${blockNumber}) error: ${e.message}`;
      if (isProd) {
        this.dingTalkSendService.sendTextToTestRoom(errorMessage);
      }
      debug(errorMessage);
    }
    this.syncApprovalEventsFromBlockNumber(contractAddress, blockNumber + 1);
  }
}
