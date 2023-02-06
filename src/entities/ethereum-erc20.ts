import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class EthereumERC20 {
  @PrimaryColumn('int', { unsigned: true })
  id: number;

  @Column('char', { length: 42 })
  contract_address: string;

  @Column('varchar', { length: 20 })
  name: string;

  @Column('varchar', { length: 10 })
  symbol: string;

  @Column('int', { unsigned: true })
  decimals: number;

  @Column('boolean')
  is_stable: boolean;

  @Column('char', { length: 42 })
  deployer: string;

  @Column('datetime')
  deploy_time: Date;

  @Column('char', { length: 66 })
  creation_transaction_hash: string;

  @Column('text')
  description: string;

  @Column('decimal')
  total_supply: number;

  @Column('decimal')
  circulating_supply: number;

  @Column('decimal')
  market_cap_usd_latest: number;

  @Column('decimal')
  volume_usd_24h: number;

  @Column('datetime')
  last_updated: Date;
}
