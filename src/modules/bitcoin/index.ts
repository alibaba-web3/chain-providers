import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitcoinJsonRpcController } from './controllers/json-rpc';
import { BitcoinCoreService } from './services/bitcoin-core';
import { BitcoinBlock } from '@/entities/bitcoin-blocks';
import { BitcoinTransaction } from '@/entities/bitcoin-transactions';

export const bitcoinEntities = [BitcoinBlock, BitcoinTransaction];

@Module({
  controllers: [BitcoinJsonRpcController],
  providers: [BitcoinCoreService],
  imports: [TypeOrmModule.forFeature(bitcoinEntities)],
  exports: [BitcoinCoreService],
})
export class BitcoinModule {}
