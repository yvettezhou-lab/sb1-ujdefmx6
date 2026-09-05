import type { Account } from '@/models';

export function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) => {
    // 1. 手动置顶优先
    const pinnedDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
    if (pinnedDiff !== 0) return pinnedDiff;

    // 2. 最近使用优先
    const aUsed = a.lastUsedAt ?? 0;
    const bUsed = b.lastUsedAt ?? 0;

    if (aUsed !== bUsed) {
      return bUsed - aUsed;
    }

    // 3. 最后保持原来的手动顺序
    return a.sortOrder - b.sortOrder;
  });
}

export function touchAccount(account: Account): Pick<Account, 'lastUsedAt'> {
  return { lastUsedAt: Date.now() };
}
