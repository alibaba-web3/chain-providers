import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GethService } from '@/modules/eth/services/geth';
import { CommandController } from './controllers/command';

@Module({
  controllers: [CommandController],
  providers: [GethService],
  imports: [HttpModule],
})
export class DingTalkModule {}
