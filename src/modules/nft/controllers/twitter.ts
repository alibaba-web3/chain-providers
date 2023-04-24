import { Controller, Get, Res, Query } from '@nestjs/common';
import { Client, auth } from 'twitter-api-sdk';
import { Response } from 'express';

const twitterAuth = new auth.OAuth2User({
  client_id: process.env.TWITTER_CLIENT_ID,
  client_secret: process.env.TWITTER_CLIENT_SECRET,
  callback: process.env.TWITTER_CALLBACK_URL,
  scopes: ['tweet.read', 'users.read'],
});

const twitterClient = new Client(twitterAuth);

@Controller('/nft/twitter')
export class NftTwitterController {
  @Get('/oauth2/login')
  login(@Res() res: Response) {
    const authUrl = twitterAuth.generateAuthURL({
      state: process.env.TWITTER_AUTH_STATE,
      code_challenge_method: 's256',
    });
    res.redirect(authUrl);
  }

  @Get('/oauth2/callback')
  async callback(@Res() res: Response, @Query('state') state: string, @Query('code') code: string) {
    if (state !== process.env.TWITTER_AUTH_STATE) {
      return res.status(500).send('state not matched');
    }
    try {
      await twitterAuth.requestAccessToken(code);
      const tweets = await twitterClient.tweets.findTweetById('20');
      res.status(200).send(tweets.data);
    } catch (e) {
      console.log('[nft/twitter] callback error:', e);
    }
  }
}
