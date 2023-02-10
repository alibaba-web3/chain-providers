// 在已有数据同步完成时，程序会自动停止，然后讲在此时段后重新开始同步新的数据，以保证持续跟上进度
export const syncGethToMysqlRestartTime = 60 * 60 * 1000;

// 以太坊的第一条交易在 https://etherscan.io/block/46147
export const ethereumBlockNumberOfFirstTransaction = 46147;

export const ethereumTracesSyncStep = 10;
