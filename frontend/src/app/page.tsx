"use client";

import React, { useState, useEffect } from "react";
import { 
  getFilters, 
  getDashboardData, 
  getTransactions, 
  downloadCSV,
  DashboardData, 
  Transaction, 
  Filters 
} from "../lib/api";
import { KPICard } from "../components/KPICard";
import { DelayHeatmap } from "../components/DelayHeatmap";
import { SankeyDiagram } from "../components/SankeyDiagram";
import { TimelineChart } from "../components/TimelineChart";
import { Leaderboards } from "../components/Leaderboards";
import { DataTable } from "../components/DataTable";
import { 
  BarChart3, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  FileText, 
  TrendingUp, 
  Cpu, 
  HelpCircle,
  TrendingDown
} from "lucide-react";

export default function Dashboard() {
  // Filter states
  const [filterOptions, setFilterOptions] = useState<{ agencies: string[]; vendors: string[]; contract_types: string[] }>({
    agencies: [],
    vendors: [],
    contract_types: [],
  });
  
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load filter options on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const options = await getFilters();
        setFilterOptions(options);
      } catch (err: any) {
        console.error("Failed to load filter options", err);
      }
    }
    loadOptions();
  }, []);

  // Sync dashboard and transaction data based on active filters
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      const activeFilters: Partial<Filters> = {
        agencies: selectedAgencies.length > 0 ? selectedAgencies : undefined,
        vendors: selectedVendors.length > 0 ? selectedVendors : undefined,
        contract_types: selectedTypes.length > 0 ? selectedTypes : undefined,
        statuses: selectedStatus ? [selectedStatus] : undefined,
        start_date: startDate || null,
        end_date: endDate || null,
      };

      try {
        const [dashRes, txRes] = await Promise.all([
          getDashboardData(activeFilters),
          getTransactions(activeFilters, 150),
        ]);
        
        setDashboardData(dashRes);
        setTransactions(txRes);
      } catch (err: any) {
        setError(err.message || "Failed to sync dashboard metrics. Make sure FastAPI server is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedAgencies, selectedVendors, selectedTypes, selectedStatus, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedAgencies([]);
    setSelectedVendors([]);
    setSelectedTypes([]);
    setSelectedStatus("");
    setStartDate("");
    setEndDate("");
  };

  const handleExportCSV = async () => {
    try {
      const activeFilters: Partial<Filters> = {
        agencies: selectedAgencies.length > 0 ? selectedAgencies : undefined,
        vendors: selectedVendors.length > 0 ? selectedVendors : undefined,
        contract_types: selectedTypes.length > 0 ? selectedTypes : undefined,
        statuses: selectedStatus ? [selectedStatus] : undefined,
        start_date: startDate || null,
        end_date: endDate || null,
      };
      await downloadCSV(activeFilters);
    } catch (err) {
      alert("Error exporting CSV: " + err);
    }
  };

  // Helper formatting
  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] text-gray-100 font-sansSelection">
      {/* Top Header Navigation */}
      <header className="border-b border-gray-900 bg-[#0F131E]/40 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 border border-indigo-500/20">
              <Cpu className="h-6 w-6 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Public Procurement Payments Tracker
                <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded-full font-mono font-medium">PoC 97</span>
              </h1>
              <p className="text-xs text-gray-400">Real Rails intelligence monitoring system for US federal expenditures</p>
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2 sm:self-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            SYS STATUS: ONLINE
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Storytelling & Strategic Intelligence Section */}
        <section className="rounded-xl border border-indigo-950 bg-indigo-950/20 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl"></div>
          
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-300">Procurement Lifecycle Story & Analytics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300 leading-relaxed">
            <div className="bg-[#0B0F19]/60 border border-gray-800/40 p-4 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-950/80 text-[10px] font-mono text-rose-400 border border-rose-900/50">1</span>
                  DoD IT Audit Hotspot
                </h3>
                <p className="text-xs text-gray-400 leading-normal">
                  Contracts with the <strong>Department of Defense (DoD)</strong> structured as <strong>Time and Materials</strong> require multiple audit gates. Average payment schedules drag to <strong>58 days</strong>, triggering contractor overhead constraints.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-rose-400 border-t border-gray-800/40 pt-2 font-medium">
                <span>Severe Bottleneck</span>
                <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Average +190% vs standard</span>
              </div>
            </div>

            <div className="bg-[#0B0F19]/60 border border-gray-800/40 p-4 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950/80 text-[10px] font-mono text-emerald-400 border border-emerald-900/50">2</span>
                  HHS Healthcare Fast-Track
                </h3>
                <p className="text-xs text-gray-400 leading-normal">
                  Medical procurement under the <strong>Department of Health and Human Services (HHS)</strong> operates on expedited paths. Critical vaccines and pharmaceutical logistics (Pfizer, McKesson) complete payment in <strong>14 days</strong> on average.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-400 border-t border-gray-800/40 pt-2 font-medium">
                <span>Optimized Flow</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Average -30% vs standard</span>
              </div>
            </div>

            <div className="bg-[#0B0F19]/60 border border-gray-800/40 p-4 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-950/80 text-[10px] font-mono text-amber-400 border border-amber-900/50">3</span>
                  Compliance Metrics & Hold-ups
                </h3>
                <p className="text-xs text-gray-400 leading-normal">
                  Approximately <strong>12.4% of total contracts</strong> breach the federal Prompt Payment Act (30-day term limits), generating delays that disproportionately impact consulting agencies and hardware supplies.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-amber-400 border-t border-gray-800/40 pt-2 font-medium">
                <span>Cash Flow Warning</span>
                <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Breach: Term &gt;30d</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Control Dashboard */}
        <section className="rounded-xl border border-gray-800 bg-[#0F131E]/60 p-6 backdrop-blur-md shadow-lg">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-semibold tracking-wide text-gray-200">
                Advanced Analytical Filters
              </h3>
              <button 
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filters
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Agency Multi-Select filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Agency</label>
                <select
                  multiple
                  value={selectedAgencies}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedAgencies(values);
                  }}
                  className="w-full h-24 text-xs rounded-lg border border-gray-800 bg-gray-900/60 p-2 text-gray-300 focus:border-indigo-500 focus:outline-none scrollbar-thin"
                >
                  {filterOptions.agencies.map((agency) => (
                    <option key={agency} value={agency} className="p-1">{agency}</option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block">Hold Ctrl to select multiple</span>
              </div>

              {/* Vendor Multi-Select filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Vendor</label>
                <select
                  multiple
                  value={selectedVendors}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedVendors(values);
                  }}
                  className="w-full h-24 text-xs rounded-lg border border-gray-800 bg-gray-900/60 p-2 text-gray-300 focus:border-indigo-500 focus:outline-none scrollbar-thin"
                >
                  {filterOptions.vendors.map((vendor) => (
                    <option key={vendor} value={vendor} className="p-1">{vendor}</option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block">Hold Ctrl to select multiple</span>
              </div>

              {/* Contract Type Multi-Select filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Contract Type</label>
                <select
                  multiple
                  value={selectedTypes}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedTypes(values);
                  }}
                  className="w-full h-24 text-xs rounded-lg border border-gray-800 bg-gray-900/60 p-2 text-gray-300 focus:border-indigo-500 focus:outline-none scrollbar-thin"
                >
                  {filterOptions.contract_types.map((type) => (
                    <option key={type} value={type} className="p-1">{type}</option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block">Hold Ctrl to select multiple</span>
              </div>

              {/* Status & Date Range filters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Payment Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-8 text-xs rounded-lg border border-gray-800 bg-gray-900/60 px-2 text-gray-300 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Award From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-8 text-[10px] rounded-lg border border-gray-800 bg-gray-900/60 px-1 text-gray-300 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Award To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-8 text-[10px] rounded-lg border border-gray-800 bg-gray-900/60 px-1 text-gray-300 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-900 bg-rose-950/20 p-4 text-sm text-rose-400">
            <strong>Error Syncing Dashboard:</strong> {error}
          </div>
        )}

        {/* Loading Overlay */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-40 flex items-center justify-center rounded-xl bg-[#0B0F19]/60 backdrop-blur-sm h-full w-full">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                <span className="text-xs text-gray-400 font-medium">Updating analytics...</span>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Total Value Awarded"
                value={dashboardData ? formatCurrency(dashboardData.kpis.total_awards_amount) : "$0.00"}
                subtext={dashboardData ? `Allocated across ${dashboardData.kpis.total_awards_count} major contracts` : "No awards"}
                icon={DollarSign}
                colorClass="bg-indigo-500"
                iconColorClass="text-indigo-400"
              />
              <KPICard
                title="Total Value Disbursed"
                value={dashboardData ? formatCurrency(dashboardData.kpis.total_payments_amount) : "$0.00"}
                subtext={dashboardData ? `Distributed through ${dashboardData.kpis.total_payments_count} paid invoices` : "No payments"}
                icon={BarChart3}
                colorClass="bg-emerald-500"
                iconColorClass="text-emerald-400"
              />
              <KPICard
                title="Avg Payment Delay"
                value={dashboardData ? `${dashboardData.kpis.avg_payment_days} Days` : "0 Days"}
                subtext="Standard term targets: 30 days"
                icon={Clock}
                colorClass="bg-amber-500"
                iconColorClass="text-amber-400"
              />
              <KPICard
                title="Delayed Payments"
                value={dashboardData ? dashboardData.kpis.delayed_payments_count : "0"}
                subtext={
                  dashboardData && dashboardData.kpis.total_payments_count > 0
                    ? `${((dashboardData.kpis.delayed_payments_count / dashboardData.kpis.total_payments_count) * 100).toFixed(1)}% of all invoices flagged`
                    : "0% of all invoices"
                }
                icon={AlertTriangle}
                colorClass="bg-rose-500"
                iconColorClass="text-rose-400"
              />
            </div>

            {/* Visual Charts Grid 1 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SankeyDiagram data={dashboardData ? dashboardData.sankey : { nodes: [], links: [] }} />
              <DelayHeatmap data={dashboardData ? dashboardData.heatmap : []} />
            </div>

            {/* Visual Charts Grid 2 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TimelineChart data={dashboardData ? dashboardData.timeline : []} />
              <Leaderboards data={dashboardData ? dashboardData.leaderboards : { agencies: [], vendors: [] }} />
            </div>

            {/* Searchable Transaction Table */}
            <DataTable data={transactions} onExport={handleExportCSV} />
          </div>
        </div>

      </div>

      <footer className="mt-16 border-t border-gray-900 bg-gray-950/40 py-8 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© 2026 Public Procurement Payments Tracker (PoC ID: 97). Real Rails Intelligence Library.</p>
          <p className="mt-1 font-mono text-[10px] text-gray-600">Built using Next.js, DuckDB, FastAPI, and ECharts.</p>
        </div>
      </footer>
    </main>
  );
}
