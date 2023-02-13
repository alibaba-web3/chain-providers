import { Injectable } from '@nestjs/common';
import { Timeout, Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumERC20Service_event_transfer } from './event-transfer';
import { EthereumERC20BalanceDay } from '@/entities/ethereum-erc20-balance-day';
import { EthereumERC20EventTransfer } from '@/entities/ethereum-erc20-event-transfer';
import { isDev, isProd, erc20Contracts, ERC20Contract } from '@/constants';
import { ContractWithProvider, abis, debug } from '@/utils';
import { BigNumber, FixedNumber } from 'ethers';

@Injectable()
export class EthereumERC20Service_balance_day {
  constructor(
    @InjectRepository(EthereumERC20BalanceDay)
    private ethereumERC20BalanceDayRepository: Repository<EthereumERC20BalanceDay>,
    @InjectRepository(EthereumERC20EventTransfer)
    private ethereumERC20EventTransferRepository: Repository<EthereumERC20EventTransfer>,
    private ethereumERC20Service_event_transfer: EthereumERC20Service_event_transfer,
  ) {}

  // 记录 ethereum_erc20_event_transfer 表的同步进度
  latestEventDate: Map<string, Date>;

  @Timeout(0)
  @Cron(CronExpression.EVERY_HOUR)
  async main() {
    if (isDev) return;
    const [latestLog, tokens] = await Promise.all([
      this.ethereumERC20Service_event_transfer.getLatestTransferEventFromMysql(),
      this.ethereumERC20Repository.find(),
    ]);
    this.latestLogBlockNumber = latestLog.block_number;
    tokens.forEach(({ symbol, contract_address, creation_transaction_hash }) => {
      this.syncTransferEvents(contract_address, creation_transaction_hash);
      console.log(`start sync erc20 transfer events (symbol: ${symbol})`);
    });
    console.log(`start sync erc20 transfer events (token count: ${tokens.length})`);
  }

  async syncBalanceDay(contractAddress: string) {
    const [latestEvent, balance] = await Promise.all([
      this.ethereumERC20Service_event_transfer.getLatestTransferEventFromMysql(contractAddress),
      this.getLatestBalanceDateFromMysql(contractAddress),
    ]);
    if (balance) {
      // 由于除了主键，没有其它能标识唯一行的字段，所以先删掉数据再重新 insert 而不是 upsert
      await this.deleteBalanceOfDate(contractAddress, balance.date);
      this.syncBalanceDayFromDate(contractAddress, balance.date);
    }
  }

  async getLatestBalanceDateFromMysql(contractAddress: string) {
    const [balance] = await this.ethereumERC20BalanceDayRepository.find({
      where: { contract_address: contractAddress },
      order: { date: 'DESC' },
      take: 1,
    });
    return balance;
  }

  async deleteBalanceOfDate(contractAddress: string, date: Date) {
    await this.ethereumERC20BalanceDayRepository
      .createQueryBuilder('balance')
      .where(`balance.contract_address = ${contractAddress}`)
      .where(`balance.date >= ${date}`)
      .where(`balance.date < ${date + 1}`)
      .delete()
      .execute();
  }

  async syncBalanceDayFromDate(contractAddress: string, date: Date) {
    // transfer events -> 根据 block_timestamp 计算每天 ->
    // from, to 当做 address 去重（保证每个地址，每天最多只更新一次） ->
    // 调用合约 balanceOf 更新余额数据。落库。
  }
}
