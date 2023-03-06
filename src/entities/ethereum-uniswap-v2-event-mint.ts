import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class EthereumUniSwapV2EventMint {
  @PrimaryColumn('int', { unsigned: true })
  id: number;

  @Column('char', { length: 42 })
  pair_address: string;

  @Column('char', { length: 42 })
  sender: string;

  @Column('int', { unsigned: true })
  token0_amount: number;

  @Column('int', { unsigned: true })
  token1_amount: number;

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
