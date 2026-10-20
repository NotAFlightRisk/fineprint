import type { Criterion, Grade, Item, Match, Price, Value } from '#lib/data/types.ts';

function monthsAgo(today: Date, months: number) {
  const [year, month] = [today.getUTCFullYear(), today.getUTCMonth() - months];
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(today.getUTCDate(), last)))
    .toISOString()
    .slice(0, 10);
}

const sizeOf = (value: Value) => {
  if (value === 'unlimited') return Infinity;
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.length;
  return (value as Price | null)?.amount;
};

export function matches(match: Match, value: Value, today: Date) {
  if (match.is && !match.is.includes(value as string | boolean)) return false;
  if (
    match.any &&
    !(Array.isArray(value) && value.some((item) => match.any!.includes(item as string)))
  )
    return false;

  let measured = value;
  if (match.where || match.within) {
    const since = match.within && monthsAgo(today, match.within);
    measured = (value as Item[]).filter(
      (item) =>
        (!since || item.date >= since) &&
        Object.entries(match.where ?? {}).every(([field, allowed]) => allowed.includes(item[field]))
    );
  }
  const size = sizeOf(measured) ?? NaN;
  if (match.min !== undefined && !(size >= match.min)) return false;
  if (match.max !== undefined && !(size <= match.max)) return false;
  return true;
}

export function grade({ rules }: Criterion, value: Value, today: Date): Grade | undefined {
  if (value === null) return null;
  if (!rules) return 'info';
  return (['good', 'ok', 'bad'] as const).find(
    (level) => rules[level] && matches(rules[level], value, today)
  );
}
