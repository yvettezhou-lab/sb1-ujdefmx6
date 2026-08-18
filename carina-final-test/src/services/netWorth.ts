import type { Account } from '@/models';

export function calculateNetWorth(
  accounts: (Account & { balance: number })[]
) {
  return accounts
    .filter(account => account.includeInNetWorth !== false)
    .reduce((sum, account) => sum + account.balance, 0);
}
