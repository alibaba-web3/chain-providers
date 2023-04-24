import { Controller, Get, Query } from '@nestjs/common';
import { request } from '@/utils';
import { HmacSHA256 } from 'crypto-js';

@Controller('/nft/giveaway')
export class NftGiveawayController {
  @Get('/prize/callback')
  async prizeCallback(@Query('track_id') track_id: string) {
    try {
      const sign = HmacSHA256(`track_id=${track_id}`, process.env.GIVEAWAY_API_KEY).toString();
      const result = await request('https://giveaway.com/public/v1/giveaway/prize/callback', {
        data: { track_id, sign },
      });
      return result;
    } catch (e) {
      console.log('[nft/giveaway] reward callback error:', e);
    }
  }

  @Get('/player/status')
  async playerStatus(@Query('track_id') track_id: string) {
    try {
      const sign = HmacSHA256(`track_id=${track_id}`, process.env.GIVEAWAY_API_KEY).toString();
      const result = await request('https://giveaway.com/public/v1/giveaway/player/status', {
        data: { track_id, sign },
      });
      return result;
    } catch (e) {
      console.log('[nft/giveaway] reward callback error:', e);
    }
  }
}
