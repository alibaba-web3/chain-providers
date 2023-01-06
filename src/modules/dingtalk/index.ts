import { Module } from '@nestjs/common';
import { DingTalkBotController } from './controllers/bot';
import { HttpModule } from '@nestjs/axios';
import { EthModule } from '@/modules/ethereum';

@Module({
  controllers: [DingTalkBotController],
  imports: [HttpModule, EthModule],
})
export class DingTalkModule {}
