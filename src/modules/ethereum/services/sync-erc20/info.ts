import { Injectable } from '@nestjs/common';
import { Timeout, Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { isDev, isProd } from '@/constants';
import { ContractWithRemoteProvider, abis, debug } from '@/utils';
import { BigNumber, FixedNumber } from 'ethers';

interface InfoFromContract {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BigNumber;
}

interface InfoFromMarket {
  description: string;
  circulating_supply: string;
  market_cap_usd_latest: string;
  volume_usd_24h: string;
}

@Injectable()
export class EthereumERC20Service_info {
  constructor(
    @InjectRepository(EthereumERC20)
    private ethereumERC20Repository: Repository<EthereumERC20>,
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
    private dingTalkSendService: DingTalkSendService,
  ) {}

  @Timeout(0)
  @Cron(CronExpression.EVERY_HOUR)
  async main() {
    if (isDev) return;
    console.log('start syncing erc20 info');
    const oldEntities = await this.ethereumERC20Repository.find();
    const newEntities = await Promise.all(oldEntities.map((entity) => this.getNewEntity(entity)));
    await this.ethereumERC20Repository.upsert(
      newEntities.filter((e) => !!e),
      ['contract_address'],
    );
    console.log(`sync erc20 info success. (old: ${oldEntities.length}, new: ${newEntities.length})`);
  }

  async getNewEntity({ contract_address, creation_transaction_hash, is_stable }: EthereumERC20) {
    try {
      const [infoFromContract, infoFromMarket, creationTransaction] = await Promise.all([
        this.getInfoFromContract(contract_address),
        this.getInfoFromMarket(contract_address),
        this.ethereumTransactionsRepository.findOneBy({ transaction_hash: creation_transaction_hash }),
      ]);
      return {
        contract_address,
        name: infoFromContract.name,
        symbol: infoFromContract.symbol,
        decimals: infoFromContract.decimals,
        is_stable,
        deployer: creationTransaction?.from || '',
        deploy_time: creationTransaction?.block_timestamp || '',
        creation_transaction_hash,
        description: infoFromMarket.description,
        total_supply: infoFromContract.totalSupply,
        circulating_supply: BigNumber.from(infoFromMarket.circulating_supply),
        market_cap_usd_latest: FixedNumber.from(infoFromMarket.market_cap_usd_latest),
        volume_usd_24h: FixedNumber.from(infoFromMarket.volume_usd_24h),
        last_updated: new Date(),
      };
    } catch (e) {
      const errorMessage = `sync erc20 info failed.\ncontract: ${contract_address}\nerror: ${e.message}`;
      if (isProd) {
        this.dingTalkSendService.sendTextToTestRoom(errorMessage);
      }
      debug(errorMessage);
    }
  }

  async getInfoFromContract(contractAddress: string): Promise<InfoFromContract> {
    const contract = new ContractWithRemoteProvider(contractAddress, abis.erc20);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);
    return { name, symbol, decimals, totalSupply };
  }

  async getInfoFromMarket(contractAddress: string): Promise<InfoFromMarket> {
    // TODO: 从外部爬虫获取
    return {
      description: 'Todo: ' + contractAddress,
      circulating_supply: '0',
      market_cap_usd_latest: '0',
      volume_usd_24h: '0',
    };
  }
}
