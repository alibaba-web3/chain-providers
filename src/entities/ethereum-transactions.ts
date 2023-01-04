import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class EthereumTransactions {
  @PrimaryColumn()
  transaction_hash: string;

  @Column()
  transaction_index: number;

  @Column()
  block_number: number;

  @Column()
  block_hash: string;

  @Column()
  block_timestamp: number;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column()
  value: number;

  @Column()
  input: string;

  @Column()
  gas_used: number;

  @Column()
  gas_price: number;

  @Column()
  max_fee_per_gas: number;

  @Column()
  max_priority_fee_per_gas: number;

  @Column()
  effective_gas_price: number;

  @Column()
  success: boolean;

  @Column()
  nonce: number;

  @Column()
  type: number;

  @Column()
  access_list: any[];
}
