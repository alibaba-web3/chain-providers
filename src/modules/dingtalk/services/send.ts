import { Injectable } from '@nestjs/common';
import { dingTalkConversationIds, dingTalkBotUrls } from '@/constants';
import { request } from '@/utils';

@Injectable()
export class DingTalkSendService {
  sendText(url: string, content: string) {
    return request(url, {
      data: { msgtype: 'text', text: { content } },
    });
  }

  sendTextToTestRoom(content: string) {
    const url = dingTalkBotUrls[dingTalkConversationIds.test];
    return this.sendText(url, content);
  }
}
