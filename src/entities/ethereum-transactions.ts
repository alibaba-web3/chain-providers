import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EthereumBlocks } from './ethereum-blocks';

@Entity()
export class EthereumTransactions {
  @PrimaryColumn('char', { length: 66 })
  transaction_hash: string;

  @Column('int', { unsigned: true })
  transaction_index: number;

  @Column('int', { unsigned: true })
  block_number: number;

  @Column('char', { length: 66 })
  block_hash: string;

  @ManyToOne(() => EthereumBlocks, (block) => block.transactions)
  @JoinColumn([
    { name: 'block_number', referencedColumnName: 'block_number' },
    { name: 'block_hash', referencedColumnName: 'block_hash' },
  ])
  block: EthereumBlocks;

  @Column('datetime')
  block_timestamp: Date;

  @Column('char', { length: 42 })
  from: string;

  @Column('char', { length: 42 })
  to: string;

  @Column('bigint', { unsigned: true })
  value: number;

  @Column('text')
  input: string;

  @Column('int', { unsigned: true })
  gas_used: number;

  @Column('bigint', { unsigned: true })
  gas_price: number;

  @Column('bigint', { unsigned: true })
  max_fee_per_gas: number;

  @Column('bigint', { unsigned: true })
  max_priority_fee_per_gas: number;

  @Column('bigint', { unsigned: true })
  effective_gas_price: number;

  @Column('bigint', { unsigned: true })
  cumulative_gas_used: number;

  @Column('boolean')
  success: boolean;

  @Column('int', { unsigned: true })
  nonce: number;

  @Column('varchar', { length: 20 })
  type: string;

  @Column('json')
  access_list: string;
}
