import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { isProd, erc20Contracts, ERC20Contract } from '@/constants';
import { ContractWithProvider, abis, debug } from '@/utils';
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
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async main() {
    if (!isProd) return;
    try {
      const entities = await Promise.all(erc20Contracts.map((erc20Contract) => this.getEntity(erc20Contract)));
      await this.ethereumERC20Repository.upsert(entities, ['contract_address']);
      debug('sync ERC20 basic info success, entities:', entities);
    } catch (e) {
      debug('sync ERC20 basic info error:', e);
    }
  }

  async getEntity({ contractAddress, creationTransactionHash, isStable }: ERC20Contract) {
    const [infoFromContract, infoFromMarket, creationTransaction] = await Promise.all([
      this.getInfoFromContract(contractAddress),
      this.getInfoFromMarket(contractAddress),
      // Todo: 有些 Token 暂时还没找到 creationTransactionHash
      creationTransactionHash ? this.ethereumTransactionsRepository.findOneBy({ transaction_hash: creationTransactionHash }) : null,
    ]);
    return {
      contract_address: contractAddress,
      name: infoFromContract.name,
      symbol: infoFromContract.symbol,
      decimals: infoFromContract.decimals,
      is_stable: isStable,
      deployer: creationTransaction?.from || '',
      deploy_time: creationTransaction?.block_timestamp || '',
      creation_transaction_hash: creationTransactionHash,
      description: infoFromMarket.description,
      total_supply: infoFromContract.totalSupply,
      circulating_supply: BigNumber.from(infoFromMarket.circulating_supply),
      market_cap_usd_latest: FixedNumber.from(infoFromMarket.market_cap_usd_latest),
      volume_usd_24h: FixedNumber.from(infoFromMarket.volume_usd_24h),
      last_updated: new Date(),
    };
  }

  async getInfoFromContract(contractAddress: string): Promise<InfoFromContract> {
    const contract = new ContractWithProvider(contractAddress, abis.erc20);
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
