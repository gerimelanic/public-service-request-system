import { CATEGORIES, RequestCategory, RequestStatus } from './constants';

/**
 * Minimal request shape required by computeStats.
 * Accepts full ServiceRequest rows or any partial row with status and category.
 */
export interface RequestInputRow {
  status: RequestStatus | string;
  category: RequestCategory | string;
}

/**
 * Statistics per individual service category.
 */
export interface CategoryStat {
  category: RequestCategory;
  open: number;
  resolved: number;
  total: number;
}

/**
 * Aggregated analytics across the entire municipal service system.
 */
export interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  open: number;
  resolutionRate: number;
  byCategory: CategoryStat[];
}

/**
 * Computes aggregate summary statistics and per-category breakdowns from service requests.
 *
 * NOTE ON PERFORMANCE & SCALE:
 * We compute these statistics in-memory here because the admin dashboard already fetches
 * the full dataset to render the interactive request table, avoiding a redundant second
 * database roundtrip.
 *
 * At larger municipal scale (e.g. tens of thousands of requests), this aggregation would
 * move to a SQL GROUP BY query, database aggregation function, or a materialized view in
 * PostgreSQL to avoid transferring unnecessary raw rows over the wire.
 *
 * @param requests Array of service request rows with status and category
 * @returns RequestStats object containing counts and category breakdowns
 */
export function computeStats(requests: RequestInputRow[] = []): RequestStats {
  const safeRequests = requests || [];

  // 1. Initialize map for every category defined in constants.ts to ensure complete coverage,
  // even for categories that currently have zero requests.
  const categoryStatsMap = new Map<RequestCategory, { open: number; resolved: number; total: number }>();
  for (const cat of CATEGORIES) {
    categoryStatsMap.set(cat.value, { open: 0, resolved: 0, total: 0 });
  }

  let pending = 0;
  let inProgress = 0;
  let resolved = 0;

  // 2. Tally statuses and category-level metrics in a single pass O(N)
  for (const req of safeRequests) {
    if (req.status === 'pending') {
      pending += 1;
    } else if (req.status === 'in_progress') {
      inProgress += 1;
    } else if (req.status === 'resolved') {
      resolved += 1;
    }

    // Update category-level counts if category exists in our canonical list
    const catStat = categoryStatsMap.get(req.category as RequestCategory);
    if (catStat) {
      catStat.total += 1;
      if (req.status === 'resolved') {
        catStat.resolved += 1;
      } else if (req.status === 'pending' || req.status === 'in_progress') {
        catStat.open += 1;
      }
    }
  }

  const total = safeRequests.length;
  // open = pending + in_progress
  const open = pending + inProgress;

  // Resolution rate formatted as an integer percentage (0 to 100).
  // Must return 0 (not NaN) when total is 0.
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // 3. Assemble category array in canonical order matching CATEGORIES
  const byCategory: CategoryStat[] = CATEGORIES.map((cat) => {
    const stats = categoryStatsMap.get(cat.value) || { open: 0, resolved: 0, total: 0 };
    return {
      category: cat.value,
      open: stats.open,
      resolved: stats.resolved,
      total: stats.total,
    };
  });

  return {
    total,
    pending,
    inProgress,
    resolved,
    open,
    resolutionRate,
    byCategory,
  };
}
