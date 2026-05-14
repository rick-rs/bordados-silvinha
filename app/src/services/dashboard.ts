import { apiRequest } from './api';

export type DashboardMetrics = {
  orders_in_progress: number;
  monthly_revenue: string;
  overdue_orders: number;
  stock_alerts: number;
  urgent_orders: number;
  pending_payments: number;
  pending_payments_value: string;
};

export type DeadlineAlert = {
  id: number;
  order: string;
  description: string;
  status: string;
  due_date: string;
  overdue_days: number;
  days_until_due: number;
  urgent: boolean;
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

export type StatusSummary = {
  status: string;
  count: number;
};

export type UrgentOrder = {
  id: number;
  client: string;
  due_date: string;
  status: string;
};

export type DashboardSummary = {
  metrics: DashboardMetrics;
  orders_by_status: StatusSummary[];
  deadline_alerts: DeadlineAlert[];
  urgent_orders: UrgentOrder[];
  stock_replacements: StockReplacement[];
  recent_orders: RecentOrder[];
};

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>('/api/pedidos/dashboard/');
}
