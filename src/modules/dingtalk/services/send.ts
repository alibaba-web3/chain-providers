import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { dingTalkConversationIds, dingTalkBotUrls } from '@/constants';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DingTalkSendService {
  constructor(private httpService: HttpService) {}

  sendText(url: string, content: string): Promise<any> {
    return firstValueFrom(this.httpService.post(url, { msgtype: 'text', text: { content } }));
  }

  sendTextToTestRoom(content: string) {
    const url = dingTalkBotUrls[dingTalkConversationIds.test];
    return this.sendText(url, content);
  }
}
