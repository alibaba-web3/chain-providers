import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EthereumModule } from '@/modules/ethereum';
import { DingTalkBotController } from './controllers/bot';
import { DingTalkSendService } from './services/send';

@Module({
  controllers: [DingTalkBotController],
  providers: [DingTalkSendService],
  imports: [HttpModule, EthereumModule],
  exports: [DingTalkSendService],
})
export class DingTalkModule {}
