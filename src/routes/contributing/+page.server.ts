import { data } from '#lib/server/data.ts';

// oldest checked first, so the top of the list is where help goes furthest
export const load = () => {
  const { categories, providers } = data();
  const entered = categories.flatMap((category) => category.criteria).filter((c) => !c.derived);
  return {
    providers: providers
      .map(({ id, name, checked, stale, criteria }) => ({
        id,
        name,
        checked,
        stale,
        unchecked: entered.filter((c) => !criteria[c.id]).length,
        unknown: entered.filter((c) => criteria[c.id]?.value === null).length
      }))
      .sort((a, b) => a.checked.localeCompare(b.checked) || b.unchecked - a.unchecked)
  };
};
