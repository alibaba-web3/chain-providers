import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BigNumber, FixedNumber } from 'ethers';

@Entity()
export class EthereumERC20 {
  @PrimaryColumn('char', { length: 42 })
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

  @Column('decimal', {
    precision: 50,
    scale: 0,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => BigNumber.from(v),
    },
  })
  total_supply: BigNumber;

  @Column('decimal', {
    precision: 50,
    scale: 0,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => BigNumber.from(v),
    },
  })
  circulating_supply: BigNumber;

  @Column('decimal', {
    precision: 30,
    scale: 8,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => FixedNumber.from(v),
    },
  })
  market_cap_usd_latest: FixedNumber;

  @Column('decimal', {
    precision: 30,
    scale: 8,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => FixedNumber.from(v),
    },
  })
  volume_usd_24h: FixedNumber;

  @Column('datetime')
  last_updated: Date;
}
