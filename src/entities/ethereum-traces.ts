import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EthereumBlocks } from './ethereum-blocks';
import { EthereumTransactions } from './ethereum-transactions';

@Entity()
export class EthereumTraces {
  @PrimaryColumn('int', { unsigned: true })
  trace_id: number;

  @Column('json')
  trace_address: string;

  @Column('int', { unsigned: true })
  trace_children_count: number;

  @Column('boolean')
  trace_success: boolean;

  @Column('char', { length: 66 })
  transaction_hash: string;

  @Column('int', { unsigned: true })
  transaction_index: number;

  @Column('boolean')
  transaction_success: boolean;

  @Column('int', { unsigned: true })
  block_number: number;

  @Column('char', { length: 66 })
  block_hash: string;

  @Column('datetime')
  block_timestamp: Date;

  @Column('varchar', { length: 20 })
  type: string;

  @Column('varchar', { length: 20 })
  call_type: string;

  @Column('char', { length: 42 })
  contract_address: string;

  @Column('char', { length: 42 })
  refund_address: string;

  @Column('char', { length: 42 })
  from: string;

  @Column('char', { length: 42 })
  to: string;

  @Column('bigint', { unsigned: true })
  value: number;

  @Column('int', { unsigned: true })
  gas_limit: number;

  @Column('int', { unsigned: true })
  gas_used: number;

  @Column('text')
  input: string;

  @Column('text')
  output: string;

  @Column('text')
  code: string;

  @Column('text')
  error: string;

  @ManyToOne(() => EthereumTransactions, (transaction) => transaction.traces)
  @JoinColumn({ name: 'transaction_hash', referencedColumnName: 'transaction_hash' })
  transaction: EthereumTransactions;

  @ManyToOne(() => EthereumBlocks, (block) => block.traces)
  @JoinColumn([
    { name: 'block_number', referencedColumnName: 'block_number' },
    { name: 'block_hash', referencedColumnName: 'block_hash' },
  ])
  block: EthereumBlocks;
}
