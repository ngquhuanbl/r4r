"use client";

import { Check, Minus, Rocket, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface CapacityUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
}

/** Spec: ~700px, comparison cards; payment is placeholder until billing exists. */
export function CapacityUpgradeDialog({
  open,
  onOpenChange,
  businessName,
}: CapacityUpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,800px)] w-full max-w-[700px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[700px]">
        <DialogHeader className="space-y-2 px-6 pb-2 pt-6 text-left">
          <DialogTitle>Upgrade {businessName} capacity</DialogTitle>
          <DialogDescription>
            More slots mean more concurrent reviews and faster growth.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-2">
          <p className="text-sm text-muted-foreground">
            Choose the speed that fits your growth goals.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Standard</CardTitle>
                <CardDescription className="text-2xl font-semibold tabular-nums text-foreground">
                  $0<span className="text-sm font-normal"> / month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Feature icon="check">1 Active Connection Slot</Feature>
                <Feature icon="check">Unlimited Total Reviews</Feature>
                <Feature icon="minus">Standard Matching Speed</Feature>
              </CardContent>
              <CardFooter>
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Current plan
                </span>
              </CardFooter>
            </Card>

            <Card className="border-primary/30 bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Professional</CardTitle>
                <CardDescription className="text-2xl font-semibold tabular-nums text-foreground">
                  $5<span className="text-sm font-normal"> / month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Feature icon="rocket">5 Active Connection Slots</Feature>
                <Feature icon="check">Unlimited Total Reviews</Feature>
                <Feature icon="zap">Priority Matching Speed</Feature>
              </CardContent>
              <CardFooter>
                <Button type="button" className="w-full">
                  Select Professional
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Payment</p>
            <p className="mt-1">
              Add a payment method to upgrade.{" "}
              <span className="text-xs">(Stripe integration pending.)</span>
            </p>
          </div>

          <p className="text-center text-xs italic text-muted-foreground">
            Managing multiple shops? Switch to a Portfolio Plan on the
            Dashboard to save 20%.
          </p>
        </div>

        <Separator />

        <DialogFooter className="gap-2 px-6 py-4 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" disabled title="Complete payment setup first">
            Confirm upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Feature({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: "check" | "minus" | "rocket" | "zap";
}) {
  const ic =
    icon === "check" ? (
      <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
    ) : icon === "minus" ? (
      <Minus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    ) : icon === "rocket" ? (
      <Rocket className="h-4 w-4 shrink-0 text-primary" aria-hidden />
    ) : (
      <Zap className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
    );
  return (
    <div className="flex items-start gap-2">
      {ic}
      <span>{children}</span>
    </div>
  );
}
