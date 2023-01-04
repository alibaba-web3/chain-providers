import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EthereumGethService } from '@/modules/ethereum/services/geth';
import { DingTalkBotController } from './controllers/bot';

@Module({
  imports: [HttpModule],
  controllers: [DingTalkBotController],
  providers: [EthereumGethService],
})
export class DingTalkModule {}
