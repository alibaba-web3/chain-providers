import { Module } from '@nestjs/common';
import { EthereumJsonRpcController } from './controllers/json-rpc';
import { EthereumGethToMysqlService } from './services/geth-to-mysql';
import { EthereumGethService } from './services/geth';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumTraces } from '@/entities/ethereum-traces';

@Module({
  controllers: [EthereumJsonRpcController],
  providers: [EthereumGethToMysqlService, EthereumGethService],
  imports: [HttpModule, TypeOrmModule.forFeature([EthereumBlocks, EthereumTransactions, EthereumLogs, EthereumTraces])],
  exports: [EthereumGethToMysqlService, EthereumGethService],
})
export class EthModule {}
