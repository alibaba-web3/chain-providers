import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class EthereumBlocks {
  @PrimaryColumn()
  block_number: number;

  @PrimaryColumn()
  block_hash: string;

  @Column()
  parent_block_hash: string;

  @Column()
  gas_limit: number;

  @Column()
  gas_used: number;

  @Column()
  base_fee_per_gas: number;

  @Column()
  size: number;

  @Column()
  miner: string;

  @Column()
  nonce: number;

  @Column()
  timestamp: number;

  @Column()
  transactions_count: number;
}
