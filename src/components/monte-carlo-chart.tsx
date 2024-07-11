import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  year: {
    label: "Year",
    color: "hsl(var(--chart-4))",
  },
  percentile10: {
    label: "10th Percentile",
    color: "hsl(var(--chart-1))",
  },
  percentile50: {
    label: "50th Percentile",
    color: "hsl(var(--chart-2))",
  },
  percentile90: {
    label: "90th Percentile",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function MonteCarloChart({ rawData }: { rawData: number[][] }) {
  const chartData: {
    year: number;
    percentile10: number;
    percentile50: number;
    percentile90: number;
  }[] = rawData.map(([year, percentile10, percentile50, percentile90]) => ({
    year: year + 2023,
    percentile10: percentile10,
    percentile50: percentile50,
    percentile90: percentile90,
  }));
  return (
    <ChartContainer config={chartConfig} className="w-full h-96">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <YAxis
          tickFormatter={(n) => `$${nFormatter(n, 3)}`}
          tickMargin={8}
          tickCount={8}
          scale={"linear"}
        />
        <XAxis
          dataKey="year"
          tickLine={true}
          tickMargin={8}
          ticks={[0, 5, 10, 15, 20, 25, 30].map((year) => year + 2023)}
        />
        <ChartTooltip
          cursor={true}
          content={
            <ChartTooltipContent
              hideLabel={true}
              labelKey="year"
              labelFormatter={(value) => value}
              formatter={(value, name) =>
                `${chartConfig[name as keyof typeof chartConfig].label}: $${nFormatter(Number(value), 1)}`
              }
            />
          }
        />
        <Line
          dataKey="percentile10"
          type="monotone"
          stroke="var(--color-percentile10)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="percentile50"
          type="monotone"
          stroke="var(--color-percentile50)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="percentile90"
          type="monotone"
          stroke="var(--color-percentile90)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

function nFormatter(num: number, digits = 3) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "Q" },
  ];
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
  const item = lookup.findLast((item) => num >= item.value);
  return item
    ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol)
    : "0";
}
