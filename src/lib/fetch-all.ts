type Page = PromiseLike<{
  data: unknown[] | null;
  error: { message: string } | null;
}>;

const PAGE_SIZE = 1000;

export async function fetchAll<T>(
  build: (from: number, to: number) => Page,
): Promise<T[]> {
  const results: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await build(from, to);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as T[];

    results.push(...rows);

    if (rows.length < PAGE_SIZE) break;
  }
  return results;
}
