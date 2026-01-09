"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeads, LeadRow } from "@/lib/leads";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { SalesCategoryChart } from "@/components/admin/SalesCategoryChart";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import Link from "next/link";

type ChartView = 'revenue' | 'services' | 'status';

export default function AdminDashboard() {
    const [chartView, setChartView] = useState<ChartView>('revenue');

    // Fetch Leads
    const { data: leads, isLoading } = useQuery({
        queryKey: ["leads", "all"], // Updated key to reflect 'all' param
        queryFn: () => getLeads({ all: true }), // Calling with all: true for Admin view
    });

    const leadsData = (leads || []) as unknown as LeadRow[];

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse text-sm">Loading dashboard metrics...</div>;
    }

    // --- Metrics Calculation ---

    // 1. Total Revenue
    const totalRevenue = leadsData
        .filter(l => l.status === 'Closed' && l.premium_investment)
        .reduce((sum, l) => sum + (l.premium_investment || 0), 0);

    // 2. Total Orders
    const totalOrders = leadsData.filter(l => l.status === 'Closed').length;

    // 3. Total Visitors
    const totalVisitors = leadsData.length;

    // 4. Net Profit
    const netProfit = totalRevenue * 0.6;

    // 6. Chart Data Logic
    let chartData: number[] = [];
    let chartLabels: string[] = [];
    let chartTitle = "Revenue Overview";

    if (chartView === 'revenue') {
        const revenueByMonth = new Array(12).fill(0);
        leadsData.forEach(l => {
            if (l.status === 'Closed' && l.premium_investment && l.date) {
                const d = new Date(l.date);
                if (!isNaN(d.getTime())) {
                    revenueByMonth[d.getMonth()] += l.premium_investment;
                }
            }
        });
        // Fallback or use real data
        chartData = revenueByMonth.some(v => v > 0)
            ? revenueByMonth
            : [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 20000, 40000, 45000, 50000];
        chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        chartTitle = "Monthly Revenue";
    } else if (chartView === 'services') {
        const serviceMap: Record<string, number> = {};
        leadsData.forEach(l => {
            if (l.status === 'Closed' && l.premium_investment) {
                const s = l.service_name || "Unknown";
                serviceMap[s] = (serviceMap[s] || 0) + l.premium_investment;
            }
        });
        chartLabels = Object.keys(serviceMap);
        chartData = Object.values(serviceMap);
        chartTitle = "Revenue by Service";
        // If empty, mock
        if (chartData.length === 0) {
            chartLabels = ["Web", "SEO", "Design", "Marketing"];
            chartData = [150000, 80000, 60000, 120000];
        }
    } else if (chartView === 'status') {
        const statusMap: Record<string, number> = {};
        leadsData.forEach(l => {
            const s = l.status || "Unknown";
            // Count or Value? User asked for "deals status". Count is usually better for status distribution.
            // But since we are showing bars, let's show Count for now.
            statusMap[s] = (statusMap[s] || 0) + 1;
        });
        chartLabels = Object.keys(statusMap);
        chartData = Object.values(statusMap);
        chartTitle = "Deals by Status";
        // If empty, mock
        if (chartData.length === 0) {
            chartLabels = ["New", "In Progress", "Closed", "Lost"];
            chartData = [15, 25, 45, 5];
        }
    }

    // 7. Sales Category Data (Donut)
    const categoryCounts: Record<string, number> = {};
    leadsData.filter(l => l.status === 'Closed').forEach(l => {
        const cat = l.service_name || "Other";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryChartData = Object.entries(categoryCounts).map(([label, count], index) => {
        const colors = ['#000000', '#5D5FEF', '#FFB020', '#10B981', '#F43F5E', '#8B5CF6'];
        return {
            label,
            value: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
            color: colors[index % colors.length]
        };
    });

    const finalCategoryData = categoryChartData.length > 0 ? categoryChartData : [
        { label: 'Web Development', value: 35, color: '#5D5FEF' },
        { label: 'SEO', value: 30, color: '#F59E0B' },
        { label: 'Marketing', value: 20, color: '#10B981' },
        { label: 'Design', value: 15, color: '#F43F5E' },
    ];


    return (
        <div className="space-y-3 p-2 md:p-4 pt-1 pb-10 max-w-[1600px] mx-auto">
            {/* Header - Compact */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                <div>
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        Hello, Admin! <span className="text-lg">👋</span>
                    </h1>
                    <p className="text-muted-foreground text-xs font-medium">Get detailed insights into your business performance.</p>
                </div>
                <div>
                    <Link href="/dashboard/admin/users">
                        <Button size="sm" className="h-8 bg-black hover:bg-zinc-800 text-white text-xs">
                            <Users className="w-3 h-3 mr-2" />
                            Manage Users
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Top Row: Stat Cards */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total revenue" value={`₹${totalRevenue.toLocaleString()}`} trend={2.57} variant="primary" />
                <StatCard title="Closed Deals" value={totalOrders.toString()} trend={2.67} />
                <StatCard title="Total Leads" value={totalVisitors.toString()} trend={-2.67} />
                <StatCard title="Revenue" value={`₹${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} trend={5.67} />
            </div>

            {/* Middle Row & Bottom Row Grid */}
            <div className="grid gap-3 md:grid-cols-12 lg:grid-rows-2 h-auto">

                {/* Dynamic Chart - Large */}
                <div className="md:col-span-8 lg:row-span-2 min-h-[350px] relative">
                    {/* View Toggle - Absolute positioned or integrated */}
                    <div className="absolute top-6 right-6 z-10 w-[120px]">
                        <Select value={chartView} onValueChange={(v: string) => setChartView(v as ChartView)}>
                            <SelectTrigger className="h-7 text-[10px] bg-white border-zinc-200 shadow-sm">
                                <SelectValue placeholder="View" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                <SelectItem value="revenue">Monthly Revenue</SelectItem>
                                <SelectItem value="services">Revenue by Service</SelectItem>
                                <SelectItem value="status">Deals Status</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <RevenueChart
                        data={chartData}
                        labels={chartLabels}
                        title={chartTitle}
                        subTitle={`Analysis by ${chartView}`}
                    />
                </div>

                {/* Sales By Category - Bottom Right */}
                <div className="md:col-span-4 lg:row-span-2 min-h-[350px]">
                    <SalesCategoryChart data={finalCategoryData} />
                </div>
            </div>
        </div>
    );
}
