export function idempotencyKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export const OPERATIONS_PAGE_SIZE = 100;

export async function collectPagedResults<T>(
  fetchPage: (
    pageNumber: number,
  ) => Promise<{ data?: T[] | null; pagination: { hasNext: boolean } }>,
) {
  const items: T[] = [];
  let pageNumber = 1;

  while (true) {
    const page = await fetchPage(pageNumber);
    items.push(...(page.data ?? []));
    if (!page.pagination.hasNext) return items;
    pageNumber += 1;
  }
}
