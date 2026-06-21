const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Filters {
  agencies: string[];
  vendors: string[];
  contract_types: string[];
  statuses: string[];
  start_date: string | null;
  end_date: string | null;
}

export interface KPIStats {
  total_awards_count: number;
  total_awards_amount: number;
  total_payments_count: number;
  total_payments_amount: number;
  avg_payment_days: number;
  delayed_payments_count: number;
}

export interface HeatmapItem {
  agency: string;
  contract_type: string;
  avg_days: number;
  count: number;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface TimelineItem {
  month: string;
  days_to_invoice: number;
  days_to_payment: number;
  count: number;
}

export interface LeaderboardEntity {
  name: string;
  awards: number;
  payments_amount: number;
  avg_delay: number;
  delay_rate: number;
}

export interface Leaderboards {
  agencies: LeaderboardEntity[];
  vendors: LeaderboardEntity[];
}

export interface DashboardData {
  kpis: KPIStats;
  heatmap: HeatmapItem[];
  sankey: SankeyData;
  timeline: TimelineItem[];
  leaderboards: Leaderboards;
}

export interface Transaction {
  award_id: string;
  agency_name: string;
  vendor_name: string;
  award_date: string;
  award_amount: number;
  contract_type: string;
  award_status: string;
  invoice_id: string;
  invoice_date: string;
  invoice_amount: number;
  invoice_status: string;
  payment_id: string;
  payment_date: string;
  payment_amount: number;
  payment_status: string;
  completion_days: number | null;
}

export async function getFilters(): Promise<{ agencies: string[]; vendors: string[]; contract_types: string[] }> {
  const res = await fetch(`${API_BASE_URL}/api/filters`);
  if (!res.ok) throw new Error('Failed to fetch filter options');
  return res.json();
}

export async function getDashboardData(filters: Partial<Filters>): Promise<DashboardData> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function getTransactions(filters: Partial<Filters>, limit = 150): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE_URL}/api/transactions?limit=${limit}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
  if (!res.ok) throw new Error('Failed to fetch transaction data');
  return res.json();
}

export async function downloadCSV(filters: Partial<Filters>): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
  if (!res.ok) throw new Error('Failed to export CSV');
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `procurement_payments_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
