export enum dingTalkConversationIds {
  test = 'cidEp5oQwfzNQu9yC2riTDk+A==',
  web3_genesis_team = 'cidyRgYjzGSSs/QTS0DhMTCVQ==',
  web3_seminar = 'cidOFP6PFyRUDofdPK1x1PZ+g==',
  web3_community = 'cidg36MXkyFtGKH84mxnWItOQ==',
}

const url = 'https://oapi.dingtalk.com/robot/send?access_token=';
export const dingTalkBotUrls = {
  [dingTalkConversationIds.test]: url + process.env.DINGTALK_BOT_TOKEN_TEST,
  [dingTalkConversationIds.web3_genesis_team]: url + process.env.DINGTALK_BOT_TOKEN_WEB3_GENESIS_TEAM,
  [dingTalkConversationIds.web3_seminar]: url + process.env.DINGTALK_BOT_TOKEN_WEB3_SEMINAR,
  [dingTalkConversationIds.web3_community]: url + process.env.DINGTALK_BOT_TOKEN_WEB3_COMMUNITY,
};
