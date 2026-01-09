"use client";

import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartData
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(ArcElement, Tooltip, Legend);

interface SalesCategoryChartProps {
    data: { label: string; value: number; color: string }[];
}

export function SalesCategoryChart({ data }: SalesCategoryChartProps) {
    const chartData: ChartData<"doughnut"> = {
        labels: data.map(d => d.label),
        datasets: [
            {
                data: data.map(d => d.value),
                backgroundColor: data.map(d => d.color),
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                display: false, // We'll build a custom legend
            },
            tooltip: {
                backgroundColor: '#1E1E2E',
                callbacks: {
                    label: (context: any) => ` ${context.label}: ${context.raw}`
                }
            }
        },
    };

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader className="pt-6 px-6 pb-2">
                <div>
                    <CardTitle className="text-base font-bold">Sales by Category</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">This month vs last</p>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="h-[180px] w-[180px] relative">
                    <Doughnut options={options} data={chartData} />
                </div>
                <div className="mt-8 w-full space-y-3">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                            </div>
                            <span className="font-bold">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
