import { Module } from '@nestjs/common';
import { NftTwitterController } from './controllers/twitter';

@Module({
  controllers: [NftTwitterController],
})
export class NftModule {}
