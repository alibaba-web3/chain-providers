import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommandController } from './controllers/command';
import { GethService } from '../eth/services/geth';

@Module({
  controllers: [CommandController],
  providers: [GethService],
  imports: [HttpModule],
})
export class DingTalkModule {}
