import { Controller, Post, Body } from '@nestjs/common';

@Controller('/dingtalk/command')
export class CommandController {
  @Post()
  async index(@Body() body: any) {
    console.log('POST /dingtalk/command body:', body);
    return '';
  }
}
