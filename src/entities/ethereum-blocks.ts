import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { EthereumTransactions } from './ethereum-transactions';

@Entity()
export class EthereumBlocks {
  @PrimaryColumn('int', { unsigned: true })
  block_number: number;

  @PrimaryColumn('char', { length: 66 })
  block_hash: string;

  @Column('char', { length: 66 })
  parent_block_hash: string;

  @Column('int', { unsigned: true })
  gas_limit: number;

  @Column('int', { unsigned: true })
  gas_used: number;

  @Column('int', { unsigned: true })
  base_fee_per_gas: number;

  @Column('int', { unsigned: true })
  size: number;

  @Column('char', { length: 42 })
  miner: string;

  @Column('int', { unsigned: true })
  nonce: number;

  @Column('datetime')
  timestamp: Date;

  @Column('int', { unsigned: true })
  transactions_count: number;

  @OneToMany(() => EthereumTransactions, (transaction) => transaction.block)
  transactions: EthereumTransactions[];
}
