"use client";

import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartData
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface RevenueChartProps {
    data: number[];
    labels: string[];
    title?: string;
    subTitle?: string;
}

export function RevenueChart({ data, labels, title = "Revenue", subTitle = "This month vs last" }: RevenueChartProps) {
    const chartData: ChartData<"bar"> = {
        labels,
        datasets: [
            {
                data: data,
                backgroundColor: (context) => {
                    return '#000000';
                },
                borderRadius: 8,
                barThickness: 32,
                hoverBackgroundColor: '#27272a',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1E1E2E',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `${title}: ${context.raw.toLocaleString()}`
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#F3F4F6',
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        size: 11,
                        family: 'Inter'
                    },
                    color: '#9CA3AF',
                    callback: (value: any) => {
                        if (typeof value === 'number') {
                            return value >= 1000 ? value / 1000 + 'k' : value;
                        }
                        return value;
                    }
                },
                border: { display: false }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        size: 11,
                        family: 'Inter'
                    },
                    color: '#9CA3AF',
                },
                border: { display: false }
            },
        },
    };

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader className="pt-6 px-6 pb-2">
                <div>
                    <CardTitle className="text-xl font-bold">{title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{subTitle}</p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <Bar options={options} data={chartData} />
                </div>
            </CardContent>
        </Card>
    );
}
