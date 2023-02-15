import { Module } from '@nestjs/common';
import { EthereumModule } from '@/modules/ethereum';
import { DingTalkBotController } from './controllers/bot';
import { DingTalkSendService } from './services/send';

@Module({
  controllers: [DingTalkBotController],
  providers: [DingTalkSendService],
  imports: [EthereumModule],
})
export class DingTalkModule {}
