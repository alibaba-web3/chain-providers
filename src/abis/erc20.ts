export const erc20_common = [
  'function decimals() public view returns (uint8)',
  'function totalSupply() public view returns (uint256)',
  'function balanceOf(address owner) public view returns (uint256 balance)',
  'function transfer(address to, uint256 value) public returns (bool success)',
  'function transferFrom(address from, address to, uint256 value) public returns (bool success)',
  'function approve(address spender, uint256 value) public returns (bool success)',
  'function allowance(address owner, address spender) public view returns (uint256 remaining)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export const erc20 = [
  ...erc20_common,
  'function name() public view returns (string)', // 在合约中存储字符串类型会消耗更多 gas
  'function symbol() public view returns (string)',
];

export const erc20_bytes = [
  ...erc20_common,
  'function name() public view returns (bytes32)', // 所以有些合约会直接使用 bytes
  'function symbol() public view returns (bytes32)',
];
