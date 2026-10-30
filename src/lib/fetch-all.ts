type Page = PromiseLike<{
  data: unknown[] | null;
  error: { message: string } | null;
}>;

export async function fetchAll<T>(
  build: (from: number, to: number) => Page,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as T[]));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}
