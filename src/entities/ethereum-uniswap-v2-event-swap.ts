import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class EthereumUniSwapV2EventSwap {
  @PrimaryColumn('int', { unsigned: true })
  id: number;

  @Column('char', { length: 42 })
  pair_address: string;

  @Column('char', { length: 42 })
  sender: string;

  @Column('char', { length: 42 })
  to: string;

  @Column('int', { unsigned: true })
  token0_amount_in: number;

  @Column('int', { unsigned: true })
  token0_amount_out: number;

  @Column('int', { unsigned: true })
  token1_amount_in: number;

  @Column('int', { unsigned: true })
  token1_amount_out: number;

  @Column('int', { unsigned: true })
  block_number: number;

  @Column('datetime')
  block_timestamp: Date;

  @Column('int', { unsigned: true })
  transaction_index: number;

  @Column('char', { length: 66 })
  transaction_hash: string;

  @Column('int', { unsigned: true })
  log_index: number;
}
