import dayjs from 'dayjs';

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function getStartOfDay(date: Date, offset = 0) {
  return dayjs(date).add(offset, 'day').startOf('day').toDate();
}
