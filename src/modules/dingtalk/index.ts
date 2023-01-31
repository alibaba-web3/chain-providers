import { Module } from '@nestjs/common';
import { DingTalkBotController } from './controllers/bot';
import { HttpModule } from '@nestjs/axios';
import { EthereumModule } from '@/modules/ethereum';

@Module({
  controllers: [DingTalkBotController],
  imports: [HttpModule, EthereumModule],
})
export class DingTalkModule {}
