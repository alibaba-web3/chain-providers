import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BigNumber } from 'ethers';

@Entity()
export class EthereumERC20BalanceDay {
  @PrimaryColumn('int', { unsigned: true })
  id: number;

  @Column('char', { length: 42 })
  contract_address: string;

  @Column('char', { length: 42 })
  owner: string;

  @Column('decimal', {
    precision: 30,
    scale: 8,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => BigNumber.from(v),
    },
  })
  amount: BigNumber;

  @Column('decimal', {
    precision: 50,
    scale: 0,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => BigNumber.from(v),
    },
  })
  amount_raw: BigNumber;

  @Column('decimal', {
    precision: 30,
    scale: 8,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => BigNumber.from(v),
    },
  })
  amount_usd: BigNumber;

  @Column('datetime')
  date: Date;
}
