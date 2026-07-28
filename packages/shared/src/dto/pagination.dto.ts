/**
 * Generic paginated response wrapper for HTTP APIs.
 */
export interface IPaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
