import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";


interface StatCardProps {
    title: string;
    value: string;
    trend?: number;
    trendLabel?: string;
    variant?: "default" | "primary";
    className?: string;
}

export function StatCard({
    title,
    value,
    trend,
    trendLabel = "This month vs last",
    variant = "default",
    className
}: StatCardProps) {
    const isPrimary = variant === "primary";

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-200 border-none shadow-sm",
            isPrimary ? "bg-[#5D5FEF] text-white" : "bg-white text-zinc-950 hover:shadow-md",
            className
        )}>
            <div className="p-6 flex flex-col gap-1">
                <h3 className={cn(
                    "text-sm font-medium",
                    isPrimary ? "text-white/90" : "text-zinc-500"
                )}>
                    {title}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                    <div className="text-2xl font-bold tracking-tight">{value}</div>
                    {trend !== undefined && (
                        <div className={cn(
                            "flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                            trend >= 0
                                ? (isPrimary ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700")
                                : (isPrimary ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700")
                        )}>
                            {trend >= 0 ? "+" : ""}{trend}%
                        </div>
                    )}
                </div>
                <p className={cn(
                    "text-xs font-medium",
                    isPrimary ? "text-white/70" : "text-zinc-400"
                )}>
                    {trendLabel}
                </p>
            </div>
        </Card>
    );
}
