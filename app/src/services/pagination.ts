export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : '';
}

export function unwrapResults<T>(response: T[] | PaginatedResponse<T>) {
  return Array.isArray(response) ? response : response.results;
}
