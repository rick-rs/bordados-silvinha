import { apiRequest } from './api';

export type DashboardMetrics = {
  orders_in_progress: number;
  monthly_revenue: string;
  overdue_orders: number;
  stock_alerts: number;
};

export type DeadlineAlert = {
  id: number;
  order: string;
  description: string;
  status: string;
  due_date: string;
};

export type StockReplacement = {
  id: number;
  name: string;
  remaining: string;
};

export type RecentOrder = {
  id: number;
  number: string;
  client: string;
  due_date: string;
  status: string;
  payment: string;
};

export type DashboardSummary = {
  metrics: DashboardMetrics;
  deadline_alerts: DeadlineAlert[];
  stock_replacements: StockReplacement[];
  recent_orders: RecentOrder[];
};

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>('/api/pedidos/dashboard/');
}
