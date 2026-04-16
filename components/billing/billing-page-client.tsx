"use client";

import { CreditCard, Download, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  createBillingPortalSession,
  type BillingInvoiceRow,
} from "@/app/(protected)/billing/actions";
import {
  TIER_LABELS,
  TIER_MONTHLY_USD,
  TIER_STARTER,
  type BillingTier,
} from "@/lib/billing/tiers";
import { ManageSubscriptionDialog } from "@/components/billing/manage-subscription-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paths } from "@/constants/paths";
import type { Tables } from "@/types/database";
import type { FetchedBusiness } from "@/types/dashboard";

type Row = {
  business: FetchedBusiness;
  billing: Tables<"business_billing"> | null;
};

type PaymentSummary = {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
} | null;

type Props = {
  stripeConfigured: boolean;
  totalMonthlyUsd: number;
  nextRenewal: string | null;
  businessRows: Row[];
  payment: PaymentSummary;
  invoices: BillingInvoiceRow[];
};

function tierForRow(billing: Tables<"business_billing"> | null): BillingTier {
  if (!billing) return TIER_STARTER;
  return billing.tier as BillingTier;
}

export function BillingPageClient({
  stripeConfigured,
  totalMonthlyUsd,
  nextRenewal,
  businessRows,
  payment,
  invoices,
}: Props) {
  const router = useRouter();
  const [manage, setManage] = useState<Row | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await createBillingPortalSession();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      window.location.href = res.url;
    } finally {
      setPortalLoading(false);
    }
  };

  const renewalLabel = nextRenewal
    ? new Date(nextRenewal).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-10 pb-16 pt-6 md:pt-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Billing
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Subscription & invoices
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage per-business plans and your shared payment method.
          </p>
        </div>
        <Link
          href={Paths.ACCOUNT}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Account settings
        </Link>
      </div>

      {!stripeConfigured ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Stripe is not configured. Add{" "}
          <code className="text-xs">STRIPE_SECRET_KEY</code> and Price IDs to
          enable live billing.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing summary</CardTitle>
          <CardDescription>
            Total recurring charges across all business plans on this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Total monthly subscription
            </p>
            <p className="text-3xl font-semibold tabular-nums">
              ${totalMonthlyUsd.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Next renewal</p>
            <p className="text-lg font-medium">
              {renewalLabel ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Business subscriptions
        </h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessRows.map(({ business, billing }) => {
                const tier = tierForRow(billing);
                const slots = billing?.slot_limit ?? 1;
                const price = TIER_MONTHLY_USD[tier];
                return (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">
                      {business.business_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TIER_LABELS[tier]}
                        {tier === TIER_STARTER ? " (Free)" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {slots} slot{slots === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => setManage({ business, billing })}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Payment method</CardTitle>
            <CardDescription>
              Shared across all subscriptions on this account (Stripe Customer
              Portal).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!stripeConfigured || portalLoading}
            onClick={() => void openPortal()}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Change card
          </Button>
        </CardHeader>
        <CardContent>
          {payment?.last4 ? (
            <p className="text-sm">
              <span className="uppercase">{payment.brand ?? "Card"}</span>{" "}
              •••• {payment.last4}
              {payment.expMonth && payment.expYear
                ? ` · Exp ${String(payment.expMonth).padStart(2, "0")}/${String(payment.expYear).slice(-2)}`
                : null}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No card on file yet. Open the portal to add a payment method
              before upgrading.
            </p>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Billing history
        </h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      {new Date(inv.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${inv.amountUsd.toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize">{inv.status}</TableCell>
                    <TableCell>
                      {inv.pdfUrl ? (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {manage ? (
        <ManageSubscriptionDialog
          open={!!manage}
          onOpenChange={(o) => {
            if (!o) setManage(null);
            if (!o) router.refresh();
          }}
          businessId={manage.business.id}
          businessName={manage.business.business_name}
          currentTier={tierForRow(manage.billing)}
          nextRenewalLabel={renewalLabel}
        />
      ) : null}
    </div>
  );
}
