import { Module } from '@nestjs/common';
import { BitcoinModule } from '@/modules/bitcoin';
import { EthereumModule } from '@/modules/ethereum';
import { DingTalkBotController } from './controllers/bot';
import { DingTalkSendService } from './services/send';

@Module({
  controllers: [DingTalkBotController],
  providers: [DingTalkSendService],
  imports: [BitcoinModule, EthereumModule],
})
export class DingTalkModule {}
