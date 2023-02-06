import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class EthereumERC20BalanceDay {
  @PrimaryColumn('int', { unsigned: true })
  id: number;

  @Column('char', { length: 42 })
  contract_address: string;

  @Column('char', { length: 42 })
  owner: string;

  @Column('decimal')
  amount: number;

  @Column('decimal')
  amount_raw: number;

  @Column('decimal')
  amount_usd: number;

  @Column('datetime')
  date: Date;
}
