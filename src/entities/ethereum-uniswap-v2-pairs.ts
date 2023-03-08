import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class EthereumUniSwapV2Pair {
  @PrimaryColumn('char', { length: 42 })
  contract_address: string;

  @Column('varchar', { length: 20 })
  name: string;

  @Column('char', { length: 42 })
  token0_address: string;

  @Column('char', { length: 42 })
  token1_address: string;
}
