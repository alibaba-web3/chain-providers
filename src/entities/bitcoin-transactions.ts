import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BitcoinBlock } from './bitcoin-blocks';
import { BigNumber, FixedNumber } from 'ethers';

@Entity()
export class BitcoinTransaction {
  @PrimaryColumn('char', { length: 64 })
  id: string;

  @Column('int', { unsigned: true })
  index: number;

  @Column('int', { unsigned: true })
  block_height: number;

  @Column('datetime')
  block_time: Date;

  @Column('int', { unsigned: true })
  size: number;

  @Column('int', { unsigned: true })
  size_virtual: number;

  @Column('boolean')
  is_coinbase: boolean;

  @Column('boolean')
  is_witness: boolean;

  @Column('decimal', {
    precision: 10,
    scale: 8,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => v && FixedNumber.from(v),
    },
  })
  fee?: FixedNumber;

  @Column('decimal', {
    precision: 20,
    scale: 8,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => v && FixedNumber.from(v),
    },
  })
  input_value?: FixedNumber;

  @Column('decimal', {
    precision: 20,
    scale: 8,
    transformer: {
      to: (v: FixedNumber) => v.toString(),
      from: (v: string) => v && FixedNumber.from(v),
    },
  })
  output_value?: FixedNumber;

  @Column('int', { unsigned: true })
  input_count: number;

  @Column('int', { unsigned: true })
  output_count: number;

  @Column('json')
  input: string;

  @Column('json')
  output: string;

  @Column('text')
  hex: string;

  @Column('text')
  coinbase: string;

  @Column('int', { unsigned: true })
  weight: number;

  @Column('int', { unsigned: true })
  lock_time: number;

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

  @ManyToOne(() => BitcoinBlock, (block) => block.transactions)
  @JoinColumn([{ name: 'block_height', referencedColumnName: 'height' }])
  block: BitcoinBlock;
}
