import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JsonRpcController } from './controllers/json-rpc';
import { GethService } from './services/geth';

@Module({
  controllers: [JsonRpcController],
  providers: [GethService],
  imports: [HttpModule],
})
export class EthModule {}
