import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumERC20EventApproval } from '@/entities/ethereum-erc20-event-approval';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { isProd, ethereumBlockNumberOfFirstTransaction } from '@/constants';
import { debug } from '@/utils';
import { ethers, BigNumber } from 'ethers';

@Injectable()
export class EthereumERC20Service_event_approval {
  constructor(
    @InjectRepository(EthereumERC20)
    private ethereumERC20Repository: Repository<EthereumERC20>,
    @InjectRepository(EthereumERC20EventApproval)
    private ethereumERC20EventApprovalRepository: Repository<EthereumERC20EventApproval>,
    @InjectRepository(EthereumLogs)
    private ethereumLogsRepository: Repository<EthereumLogs>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async main() {
    if (!isProd) return;
    const tokens = await this.ethereumERC20Repository.find();
    tokens.forEach(({ symbol, contract_address }) => {
      debug(`start sync ERC20 approval events (symbol: ${symbol})`);
      this.syncApprovalEvents(contract_address);
    });
    debug(`start sync ERC20 approval events (token count: ${tokens.length})`);
  }

  async syncApprovalEvents(contractAddress: string) {
    const event = await this.getLatestApprovalEventFromMysql(contractAddress);
    if (event) {
      // 由于除了主键，没有其它能标识唯一行的字段，所以先删掉整个区块的数据再重新 insert 而不是 upsert
      await this.ethereumERC20EventApprovalRepository.delete({
        contract_address: contractAddress,
        block_number: event.block_number,
      });
      this.syncApprovalEventsFromBlockNumber(contractAddress, event.block_number);
    } else {
      // TODO: 应该从该合约的交易的第一个区块开始
      this.syncApprovalEventsFromBlockNumber(contractAddress, ethereumBlockNumberOfFirstTransaction);
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
        debug(`sync ERC20 approval events (contract: ${contractAddress}, block: ${blockNumber}, event count: ${eventEntities.length}) success 🎉`);
      }
    } catch (e) {
      debug(`sync ERC20 approval events (contract: ${contractAddress}, block: ${blockNumber}) error:`, e.message);
    }
    this.syncApprovalEventsFromBlockNumber(contractAddress, blockNumber + 1);
  }
}
