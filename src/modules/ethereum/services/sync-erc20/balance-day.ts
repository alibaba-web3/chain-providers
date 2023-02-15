import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumERC20Service_event_transfer } from './event-transfer';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumERC20EventTransfer } from '@/entities/ethereum-erc20-event-transfer';
import { EthereumERC20BalanceDay } from '@/entities/ethereum-erc20-balance-day';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { debug, getStartOfDay, tryFn, ContractWithLocalProvider, abis } from '@/utils';
import { isDev, isProd, syncRestartTime } from '@/constants';
import { BigNumber, FixedNumber } from 'ethers';
import dayjs from 'dayjs';

@Injectable()
export class EthereumERC20Service_balance_day {
  constructor(
    @InjectRepository(EthereumERC20)
    private ethereumERC20Repository: Repository<EthereumERC20>,
    @InjectRepository(EthereumERC20EventTransfer)
    private ethereumERC20EventTransferRepository: Repository<EthereumERC20EventTransfer>,
    @InjectRepository(EthereumERC20BalanceDay)
    private ethereumERC20BalanceDayRepository: Repository<EthereumERC20BalanceDay>,
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
    private ethereumERC20Service_event_transfer: EthereumERC20Service_event_transfer,
    private dingTalkSendService: DingTalkSendService,
  ) {}

  // 记录 ethereum_erc20_event_transfer 表的同步进度
  // Map: contract address => latest date
  latestTransferEventDates = new Map<string, Date>();

  @Timeout(0)
  async main() {
    if (isDev) return;
    const tokens = await this.ethereumERC20Repository.find();
    tokens.forEach(async ({ symbol, contract_address, creation_transaction_hash }) => {
      await this.cacheLatestTransferEventDate(contract_address);
      this.syncBalanceDay(symbol, contract_address, creation_transaction_hash);
    });
    console.log(`start syncing erc20 balance day`);
  }

  async cacheLatestTransferEventDate(contractAddress: string) {
    const event = await this.ethereumERC20Service_event_transfer.getLatestTransferEventFromMysql(contractAddress);
    if (event) this.latestTransferEventDates.set(contractAddress, getStartOfDay(event.block_timestamp));
  }

  async syncBalanceDay(symbol: string, contractAddress: string, creationTransactionHash: string) {
    const balance = await this.getLatestBalanceDayFromMysql(contractAddress);
    if (balance) {
      // 由于除了主键，没有其它能标识唯一行的字段，所以先删掉数据再重新 insert 而不是 upsert
      await this.ethereumERC20BalanceDayRepository.delete({ contract_address: contractAddress, date: balance.date });
      this.syncBalanceDayFromDate(symbol, contractAddress, getStartOfDay(balance.date, -1));
    } else {
      const creationTransaction = await this.ethereumTransactionsRepository.findOneBy({ transaction_hash: creationTransactionHash });
      if (creationTransaction) {
        this.syncBalanceDayFromDate(symbol, contractAddress, getStartOfDay(creationTransaction.block_timestamp));
      } else {
        console.log(`sync erc20 balance day failed. creation tx not found: ${creationTransactionHash} (${symbol})`);
      }
    }
  }

  async getLatestBalanceDayFromMysql(contractAddress: string) {
    const [balance] = await this.ethereumERC20BalanceDayRepository.find({
      where: { contract_address: contractAddress },
      order: { date: 'DESC' },
      take: 1,
    });
    return balance;
  }

  async syncBalanceDayFromDate(symbol: string, contractAddress: string, date: Date) {
    if (!this.latestTransferEventDates.has(contractAddress)) return;
    if (date >= this.latestTransferEventDates.get(contractAddress)) {
      // 没有数据了，等一段时间后有新的数据了再重新开始
      return setTimeout(async () => {
        await this.cacheLatestTransferEventDate(contractAddress);
        this.syncBalanceDayFromDate(symbol, contractAddress, date);
      }, syncRestartTime);
    }
    const startDate = dayjs(getStartOfDay(date)).format('YYYY-MM-DD HH:mm:ss');
    const endDate = dayjs(getStartOfDay(date, 1)).format('YYYY-MM-DD HH:mm:ss');
    try {
      const events = await this.ethereumERC20EventTransferRepository
        .createQueryBuilder()
        .where(`contract_address = :contractAddress`, { contractAddress })
        .andWhere(`block_timestamp >= :startDate`, { startDate })
        .andWhere(`block_timestamp < :endDate`, { endDate })
        .getMany();
      // 根据 events 的 from / to 获取当天的活跃地址，并使用 Set 去重
      const owners = [
        ...events.reduce((set, event) => {
          set.add(event.from);
          set.add(event.to);
          return set;
        }, new Set<string>()),
      ];
      // 获取每个地址的余额
      const balances = await Promise.all(
        owners.map((owner) => {
          return tryFn<BigNumber>((count) => {
            if (count > 1) console.log(`retry (${count - 1}) get erc20 balance of owner: ${owner} (${symbol})`);
            return new ContractWithLocalProvider(contractAddress, abis.erc20).balanceOf(owner, {
              blockTag: events[events.length - 1].block_number,
            });
          }, 6);
        }),
      );
      await this.ethereumERC20BalanceDayRepository.insert(
        owners.map((owner, i) => ({
          contract_address: contractAddress,
          owner,
          amount_raw: balances[i],
          amount_usd: FixedNumber.from(0), // TODO
          date: getStartOfDay(date, 1),
        })),
      );
      debug(`sync erc20 balance day (contract: ${contractAddress}, date: ${startDate}) success 🎉`);
    } catch (e) {
      const errorMessage = `sync erc20 balance day (contract: ${contractAddress}, date: ${startDate}) error: ${e.message}`;
      if (isProd) {
        this.dingTalkSendService.sendTextToTestRoom(errorMessage);
      }
      debug(errorMessage);
    }
    this.syncBalanceDayFromDate(symbol, contractAddress, getStartOfDay(date, 1));
  }
}
