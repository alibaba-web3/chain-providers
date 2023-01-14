import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EthereumBlocks } from './ethereum-blocks';
import { EthereumTransactions } from './ethereum-transactions';

@Entity()
export class EthereumLogs {
  @PrimaryColumn('int', { unsigned: true })
  log_id: number;

  @Column('int', { unsigned: true })
  log_index: number;

  @Column('char', { length: 66 })
  transaction_hash: string;

  @Column('int', { unsigned: true })
  transaction_index: number;

  @Column('int', { unsigned: true })
  block_number: number;

  @Column('char', { length: 66 })
  block_hash: string;

  @Column('datetime')
  block_timestamp: Date;

  @Column('char', { length: 42 })
  contract_address: string;

  @Column('text')
  data: string;

  @Column('int', { unsigned: true })
  topics_count: number;

  @Column('char', { length: 66 })
  topic_1: string;

  @Column('char', { length: 66 })
  topic_2: string;

  @Column('char', { length: 66 })
  topic_3: string;

  @Column('char', { length: 66 })
  topic_4: string;

  @ManyToOne(() => EthereumTransactions, (transaction) => transaction.logs)
  @JoinColumn({ name: 'transaction_hash', referencedColumnName: 'transaction_hash' })
  transaction: EthereumTransactions;

  @ManyToOne(() => EthereumBlocks, (block) => block.logs)
  @JoinColumn([
    { name: 'block_number', referencedColumnName: 'block_number' },
    { name: 'block_hash', referencedColumnName: 'block_hash' },
  ])
  block: EthereumBlocks;
}
