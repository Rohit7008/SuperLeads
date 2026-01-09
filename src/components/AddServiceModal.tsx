"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { addLeadServices } from "@/lib/leads";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ShieldCheck } from "lucide-react";
import { SERVICE_LIST } from "@/lib/constants";
import { MultiSelect } from "@/components/ui/multi-select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

interface AddServiceModalProps {
    leadId: number;
    clientName: string;
    currentServices?: string[]; // Optional: to disable already selected ones?
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddServiceModal({
    leadId,
    clientName,
    onClose,
    onSuccess,
}: AddServiceModalProps) {
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: () => addLeadServices(leadId, selectedServices),
        onSuccess: () => {
            onSuccess();
            onClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.detail || "Failed to add services. Please try again.");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedServices.length === 0) {
            setError("Please select at least one service.");
            return;
        }
        mutation.mutate();
    };

    return (
        <Sheet open={true} onOpenChange={(open: boolean) => !open && onClose()}>
            <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col border-l border-border bg-white dark:bg-zinc-950">
                <SheetHeader className="px-6 pt-5 pb-2 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50 text-left">
                    <SheetTitle className="text-lg font-bold tracking-tight text-foreground">Add Services</SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground">
                        Expand the portfolio for <span className="font-bold text-foreground">{clientName}</span>.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="flex-1 p-6 space-y-6">
                        {error && (
                            <div className="bg-destructive/5 text-destructive p-3 rounded-md text-xs font-semibold border border-destructive/10">
                                {error}
                            </div>
                        )}

                        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3">
                            <div className="p-2 bg-white dark:bg-zinc-900 rounded-md shadow-sm">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Client Identity</h4>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{clientName}</p>
                                <p className="text-[10px] text-muted-foreground mt-2 opacity-80">
                                    Adding services here will create new pipeline entries for this client.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                                Select New Services
                            </Label>
                            <MultiSelect
                                options={SERVICE_LIST as any}
                                selected={selectedServices}
                                onChange={setSelectedServices}
                                placeholder="Choose services to add..."
                                className="py-3"
                            />
                            <p className="text-[10px] text-muted-foreground/60 italic">
                                You can select multiple services. Each will be created as a separate entry.
                            </p>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-2.5">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1 rounded-md text-sm font-bold h-12 border-0 tracking-widest uppercase"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending || selectedServices.length === 0}
                            className="flex-2 rounded-md h-12 text-sm font-bold shadow-lg shadow-primary/10 tracking-widest uppercase"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            Add Services
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
