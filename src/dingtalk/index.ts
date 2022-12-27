import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommandController } from './controllers/command';

@Module({
  controllers: [CommandController],
  imports: [HttpModule],
})
export class DingTalkModule {}
