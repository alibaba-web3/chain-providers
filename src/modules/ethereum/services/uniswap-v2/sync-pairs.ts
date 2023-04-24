import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumGethSyncService_logs } from '@/modules/ethereum/services/geth/sync-logs';
import { EthereumERC20SyncService_info } from '@/modules/ethereum/services/erc20/sync-info';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumUniSwapV2Pair } from '@/entities/ethereum-uniswap-v2-pairs';
import { syncRestartTime, isProd, isDev } from '@/constants';
import { ContractWithRemoteProvider, debug } from '@/utils';
import { abis } from '@/abis';
import { ethers } from 'ethers';

// Creation TX of Uniswap V2: Factory Contract
// https://etherscan.io/tx/0xc31d7e7e85cab1d38ce1b8ac17e821ccd47dbde00f9d57f2bd8613bff9428396
const factoryAddress = '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f';
const factoryCreationBlockNumber = 10000835;

@Injectable()
export class EthereumUniSwapV2SyncService_pairs {
  constructor(
    @InjectRepository(EthereumLogs)
    private ethereumLogsRepository: Repository<EthereumLogs>,
    @InjectRepository(EthereumUniSwapV2Pair)
    private ethereumUniSwapV2PairsRepository: Repository<EthereumUniSwapV2Pair>,
    private ethereumGethSyncService_logs: EthereumGethSyncService_logs,
    private ethereumERC20SyncService_info: EthereumERC20SyncService_info,
    private dingTalkSendService: DingTalkSendService,
  ) {}

  // 记录 ethereum_logs 表的同步进度
  private latestLogBlockNumber: number;

  // @Timeout(0)
  async main() {
    if (isDev) return;
    console.log('start syncing uniswap-v2 pairs');
    const latestLog = await this.ethereumGethSyncService_logs.getLatestLogFromMysql();
    this.latestLogBlockNumber = latestLog.block_number;
    this.syncPairs();
  }

  async syncPairs() {
    const latestPair = await this.ethereumUniSwapV2PairsRepository.findOne({ order: { index: 'DESC' } });
    if (latestPair) {
      this.syncPairsFromBlockNumber(latestPair.created_block_number);
    } else {
      this.syncPairsFromBlockNumber(factoryCreationBlockNumber);
    }
  }

  async syncPairsFromBlockNumber(blockNumber: number) {
    if (blockNumber >= this.latestLogBlockNumber) {
      // 没有数据了，等一段时间后有新的数据了再重新开始
      return setTimeout(async () => {
        const latestLog = await this.ethereumGethSyncService_logs.getLatestLogFromMysql();
        this.latestLogBlockNumber = latestLog.block_number;
        this.syncPairsFromBlockNumber(blockNumber);
      }, syncRestartTime);
    }
    try {
      const logs = await this.ethereumLogsRepository.findBy({
        contract_address: factoryAddress,
        block_number: blockNumber,
        topic_1: ethers.utils.id('PairCreated(address,address,address,uint256)'),
      });
      if (logs.length > 0) {
        const pairEntities = await Promise.all(logs.map(this.getPairEntity));
        await this.ethereumUniSwapV2PairsRepository.upsert(pairEntities, ['contract_address']);
        debug(`sync uniswap-v2 pairs (block: ${blockNumber}, pair count: ${pairEntities.length}) success 🎉`);
      }
    } catch (e) {
      const errorMessage = `sync uniswap-v2 pairs (block: ${blockNumber}) error: ${e.message}`;
      if (isProd) {
        this.dingTalkSendService.sendTextToTestRoom(errorMessage);
      }
      debug(errorMessage);
    }
    this.syncPairsFromBlockNumber(blockNumber + 1);
  }

  async getPairEntity(log: EthereumLogs) {
    const token0_address = `0x${log.topic_2.slice(-40)}`;
    const token1_address = `0x${log.topic_3.slice(-40)}`;
    return {
      contract_address: `0x${log.data.slice(26, 66)}`,
      token0_address,
      token1_address,
      index: parseInt(log.data.slice(-64), 16),
      name: await this.getPairName(token0_address, token1_address),
      created_block_number: log.block_number,
    };
  }

  // 暂时用不到
  // @Cron(CronExpression.EVERY_HOUR)
  async updatePairs() {
    const pairs = await this.ethereumUniSwapV2PairsRepository.find();
    for (const { token0_address, token1_address } of pairs) {
      const factory = new ContractWithRemoteProvider(factoryAddress, abis.uniswap_v2_factory);
      const [pairAddress, name] = await Promise.all([
        factory.getPair(token0_address, token1_address),
        this.getPairName(token0_address, token1_address),
      ]);
      await this.ethereumUniSwapV2PairsRepository.update(
        { token0_address, token1_address },
        { contract_address: pairAddress, name, index: 0 }, // TODO: index
      );
    }
  }

  async getPairName(token0Address: string, token1Address: string) {
    const [{ symbol: token0Symbol }, { symbol: token1Symbol }] = await Promise.all([
      this.ethereumERC20SyncService_info.getInfoFromContract(token0Address),
      this.ethereumERC20SyncService_info.getInfoFromContract(token1Address),
    ]);
    return `${token0Symbol}/${token1Symbol}`;
  }
}
