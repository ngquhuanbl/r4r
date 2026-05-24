"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { BusinessReviewSnapshot } from "@/types/business-page";

const chartConfig = {
  accepted: {
    label: "Accepted / Valid",
    color: "hsl(173 58% 39%)",
  },
  rejected: {
    label: "Rejected / Invalid",
    color: "hsl(12 76% 61%)",
  },
} satisfies ChartConfig;

function toBarRow(
  label: string,
  part: BusinessReviewSnapshot["received"],
) {
  return {
    name: label,
    accepted: part.accepted,
    rejected: part.rejected + part.other,
  };
}

export function ReviewSnapshotChart({
  snapshot,
}: {
  snapshot: BusinessReviewSnapshot;
}) {
  const chartData = [
    toBarRow("Given", snapshot.given),
    toBarRow("Received", snapshot.received),
  ];

  return (
    <ChartContainer config={chartConfig} className="aspect-[4/3] max-h-[220px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="accepted"
          stackId="stack"
          fill="var(--color-accepted)"
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="rejected"
          stackId="stack"
          fill="var(--color-rejected)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
