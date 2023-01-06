import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumJsonRpcController } from './controllers/json-rpc';
import { EthereumBlocksService } from './services/blocks';
import { EthereumGethToMysqlService } from './services/geth-to-mysql';
import { EthereumGethService } from './services/geth';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([EthereumBlocks, EthereumTransactions]),
  ],
  controllers: [EthereumJsonRpcController],
  providers: [
    EthereumBlocksService,
    EthereumGethToMysqlService,
    EthereumGethService,
  ],
})
export class EthModule {}
