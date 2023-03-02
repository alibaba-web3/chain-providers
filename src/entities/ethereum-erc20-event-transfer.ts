import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BigNumber } from 'ethers';

@Entity()
export class EthereumERC20EventTransfer {
  @PrimaryColumn('int', { unsigned: true })
  id: number;

  @Column('char', { length: 42 })
  contract_address: string;

  @Column('char', { length: 42 })
  from: string;

  @Column('char', { length: 42 })
  to: string;

  @Column('decimal', {
    precision: 50,
    scale: 0,
    transformer: {
      to: (v: BigNumber) => v.toString(),
      from: (v: string) => v && BigNumber.from(v),
    },
  })
  value?: BigNumber;

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
