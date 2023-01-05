export const ETHEREUM_GETH_HTTP_URL = 'http://localhost:8545';

export const DINGTALK_BOT_URLS = {
  PROD: `https://oapi.dingtalk.com/robot/send?access_token=${process.env.DINGTALK_BOT_TOKEN_PROD}`,
  TEST: `https://oapi.dingtalk.com/robot/send?access_token=${process.env.DINGTALK_BOT_TOKEN_TEST}`,
};
