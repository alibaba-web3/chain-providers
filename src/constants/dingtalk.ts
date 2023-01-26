export enum DingTalkConversationIds {
  test = 'cidEp5oQwfzNQu9yC2riTDk+A==',
  web3_genesis_team = 'cidyRgYjzGSSs/QTS0DhMTCVQ==',
  web3_community = 'cidOFP6PFyRUDofdPK1x1PZ+g==',
}

const url = 'https://oapi.dingtalk.com/robot/send?access_token=';
export const DingTalkBotUrls = {
  [DingTalkConversationIds.test]: url + process.env.DINGTALK_BOT_TOKEN_TEST,
  [DingTalkConversationIds.web3_genesis_team]: url + process.env.DINGTALK_BOT_TOKEN_WEB3_GENESIS_TEAM,
  [DingTalkConversationIds.web3_community]: url + process.env.DINGTALK_BOT_TOKEN_WEB3_COMMUNITY,
};
