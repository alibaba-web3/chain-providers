import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { BitcoinTransaction } from './bitcoin-transactions';
import { BigNumber, FixedNumber } from 'ethers';

@Entity()
export class BitcoinBlock {
  @PrimaryColumn('int', { unsigned: true })
  height: number;

  @PrimaryColumn('char', { length: 64 })
  hash: string;

  @Column('char', { length: 64 })
  hash_previous: string;

  @Column('datetime')
  time: Date;

  @Column('int', { unsigned: true })
  size: number;

  @Column('int', { unsigned: true })
  size_tripped: number;

  @Column('int', { unsigned: true })
  transactions_count: number;

  @Column('int', { unsigned: true })
  witness_count: number;

  @Column('int', { unsigned: true })
  input_count: number;

  @Column('int', { unsigned: true })
  output_count: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => v && FixedNumber.from(v),
    },
  })
  input_value?: FixedNumber;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => v && FixedNumber.from(v),
    },
  })
  output_value?: FixedNumber;

  @Column('decimal', {
    precision: 10,
    scale: 8,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => v && FixedNumber.from(v),
    },
  })
  minted_value?: FixedNumber;

  @Column('decimal', {
    precision: 10,
    scale: 8,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => v && FixedNumber.from(v),
    },
  })
  fees?: FixedNumber;

  @Column('char', { length: 64 })
  miner: string;

  @Column('text')
  coinbase: string;

  @Column('char', { length: 64 })
  merkle_root: string;

  @Column('decimal', {
    precision: 20,
    scale: 2,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => v && FixedNumber.from(v),
    },
  })
  difficulty?: FixedNumber;

  @Column('decimal', {
    precision: 38,
    scale: 0,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => v && BigNumber.from(v),
    },
  })
  chainwork?: BigNumber;

  @Column('decimal', {
    precision: 12,
    scale: 0,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => v && BigNumber.from(v),
    },
  })
  nonce?: BigNumber;

  @Column('int', { unsigned: true })
  weight: number;

  @Column('char', { length: 8 })
  bits: string;

  @Column('decimal', {
    precision: 12,
    scale: 0,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => v && BigNumber.from(v),
    },
  })
  version?: BigNumber;

  @Column('datetime')
  gmt_modified: Date;

  @OneToMany(() => BitcoinTransaction, (transaction) => transaction.block)
  transactions: BitcoinTransaction[];
}
