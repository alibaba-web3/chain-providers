import { Module } from '@nestjs/common';
import { BitcoinJsonRpcController } from './controllers/json-rpc';
import { BitcoinCoreService } from './services/bitcoin-core';

@Module({
  controllers: [BitcoinJsonRpcController],
  providers: [BitcoinCoreService],
  exports: [BitcoinCoreService],
})
export class BitcoinModule {}
