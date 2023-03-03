export function bytesToString(bytes: string) {
  if (bytes.indexOf('0x') === 0) bytes = bytes.slice(2);
  const buffer = Buffer.from(bytes, 'hex');
  return buffer.toString('utf8');
}
