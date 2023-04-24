import { Module } from '@nestjs/common';
import { NftGiveawayController } from './controllers/giveaway';
import { NftTwitterController } from './controllers/twitter';

@Module({
  controllers: [NftGiveawayController, NftTwitterController],
})
export class NftModule {}
