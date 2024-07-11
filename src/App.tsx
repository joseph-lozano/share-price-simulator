import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";
import { Button, Group, Input, NumberField } from "react-aria-components";
import { MonteCarloChart } from "./components/monte-carlo-chart";
import { Label } from "./components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";

const currentPlanYear = 2023;
const years = new Array(30).fill(0).map((_, i) => i + 1);

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const [initialPrice, setInitialPrice] = useState(
    Number(searchParams.get("2023Price")) || 100,
  );
  const [initialShares, setInitialShares] = useState(
    Number(searchParams.get("initialShares")) || 0,
  );
  const [annualShares, setAnnualShares] = useState(
    Number(searchParams.get("annualShares")) || 50,
  );
  const [annualGrowthRate, setAnnualGrowthRate] = useState(
    Number(searchParams.get("annualGrowthRate")) || 10,
  );
  const [annualVolatility, setAnnualVolatility] = useState(
    Number(searchParams.get("annualVolatility")) || 10,
  );
  const [simulation, setSimulation] = useState<number[][]>([]);

  const [
    debouncedInitialPrice,
    debouncedInitialShares,
    debouncedAnnualShares,
    debouncedGrowthRate,
    debouncedVolitiliy,
  ] = useDebounce(
    [
      initialPrice,
      initialShares,
      annualShares,
      annualGrowthRate,
      annualVolatility,
    ],
    500,
  );

  useEffect(() => {
    const simulationResults = years.reduce((acc, year) => {
      const results = monteCarloSimulation(
        debouncedInitialPrice,
        debouncedAnnualShares,
        year,
        debouncedGrowthRate / 100,
        debouncedVolitiliy / 100,
        1000,
        debouncedInitialShares,
      ).toSorted((a, b) => a - b);
      const percentile10 = results[Math.floor(results.length * 0.1)];
      const percentile50 = results[Math.floor(results.length * 0.5)];
      const percentile90 = results[Math.floor(results.length * 0.9)];

      return [...acc, [year, percentile10, percentile50, percentile90]];
    }, [] as number[][]);

    const searchParams = new URLSearchParams();
    searchParams.set("2023Price", debouncedInitialPrice.toString());
    searchParams.set("initialShares", debouncedInitialShares.toString());
    searchParams.set("annualShares", debouncedAnnualShares.toString());
    searchParams.set("annualGrowthRate", debouncedGrowthRate.toString());
    searchParams.set("annualVolatility", debouncedVolitiliy.toString());

    const newurl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname +
      "?" +
      searchParams.toString();
    window.history.pushState({ path: newurl }, "", newurl);

    setSimulation(simulationResults);
  }, [
    debouncedInitialPrice,
    debouncedInitialShares,
    debouncedAnnualShares,
    debouncedGrowthRate,
    debouncedVolitiliy,
  ]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20">
      <div className="max-w-xl flex flex-col gap-8">
        <NumberInput
          label="Price"
          maxValue={1000}
          minValue={0}
          step={1}
          value={initialPrice}
          onChange={setInitialPrice}
        />
        <NumberInput
          label="2023 Shares"
          maxValue={1000}
          minValue={0}
          step={1}
          value={initialShares}
          onChange={setInitialShares}
        />
        <NumberInput
          label="Annual Shares"
          maxValue={150}
          minValue={20}
          step={1}
          value={annualShares}
          onChange={setAnnualShares}
        />
        <NumberInput
          label="Annual Growth Rate"
          maxValue={30}
          minValue={-5}
          step={1}
          value={annualGrowthRate}
          onChange={setAnnualGrowthRate}
        />
        <NumberInput
          label="Annual Volility"
          maxValue={50}
          minValue={0}
          step={1}
          value={annualVolatility}
          onChange={setAnnualVolatility}
        />
      </div>

      <div className="py-12">
        {simulation.length > 0 && (
          <MonteCarloChart
            rawData={[
              [
                0,
                debouncedInitialPrice * debouncedInitialShares,
                debouncedInitialShares * debouncedInitialPrice,
                debouncedInitialShares * debouncedInitialPrice,
              ],
              ...simulation,
            ]}
          />
        )}
      </div>

      <div className="my-12">
        <Table>
          <TableCaption>Monte Carlo Simulation</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Year</TableHead>
              <TableHead>Total Shares</TableHead>
              <TableHead className="text-right">Median Price</TableHead>
              <TableHead className="text-right">10th Percentile</TableHead>
              <TableHead className="text-right">50th Percentile</TableHead>
              <TableHead className="text-right">90th Percentile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold">{currentPlanYear}</TableCell>
              <TableCell className="font-bold">
                {debouncedInitialShares}
              </TableCell>
              <TableCell className="text-right font-bold font-mono">
                {formatMoney(debouncedInitialPrice)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatMoney(debouncedInitialShares * debouncedInitialPrice)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatMoney(debouncedInitialShares * debouncedInitialPrice)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatMoney(debouncedInitialShares * debouncedInitialPrice)}
              </TableCell>
            </TableRow>
            {simulation.map(
              ([year, percentile10, percentile50, percentile90]) => (
                <TableRow key={year}>
                  <TableCell className="font-bold">
                    {year + currentPlanYear}
                  </TableCell>
                  <TableCell className="font-bold">
                    {debouncedInitialShares + debouncedAnnualShares * year}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono">
                    {formatMoney(
                      percentile50 /
                        (debouncedInitialShares + debouncedAnnualShares * year),
                    )}
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {formatMoney(percentile10)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(percentile50)}
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {formatMoney(percentile90)}
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type SliderProps = {
  maxValue: number;
  minValue: number;
  step: number;
  label: string;
  value: number;
  onChange: (value: number) => void;
};
function NumberInput({
  maxValue,
  minValue,
  value,
  step,
  label,
  onChange,
}: SliderProps) {
  return (
    <NumberField
      maxValue={maxValue}
      minValue={minValue}
      step={step}
      value={value}
      onChange={onChange}
      className="grid w-full max-w-sm items-center gap-1.5"
    >
      <Label>{label}</Label>
      <Group className="group">
        <Button
          className={
            "border group-focus-within:border-blue-700 group-focus-within:border-2 group-focus-within:border-r-0 border-r-0 rounded-l-md px-2 py-1"
          }
          slot="decrement"
        >
          -
        </Button>
        <Input
          className={
            "border outline-none group-focus-within:border-blue-700 group-focus-within:border-y-2 border-x-0 rounded-none px-2 py-1"
          }
        />
        <Button
          className={
            "border group-focus-within:border-blue-700 group-focus-within:border-2 group-focus-within:border-l-0 border-l-0 rounded-r-md px-2 py-1"
          }
          slot="increment"
        >
          +
        </Button>
      </Group>
    </NumberField>
  );
}

function monteCarloSimulation(
  initialPrice: number,
  annualShares: number,
  years: number,
  annualGrowthRate: number,
  annualVolatility: number,
  numSimulations: number,
  initialShares: number = 0,
) {
  const results = [];

  for (let i = 0; i < numSimulations; i++) {
    let price = initialPrice;
    let totalShares = initialShares;
    let portfolioValue = initialShares * price;

    for (let year = 0; year < years; year++) {
      totalShares += annualShares;
      // Simulate the stock price at the end of the year using geometric Brownian motion
      const growth =
        annualGrowthRate + annualVolatility * randomNormalDistribution();
      price *= 1 + growth;

      portfolioValue = totalShares * price;
    }

    results.push(portfolioValue);
  }

  return results;
}

// Helper function to generate random numbers with a normal distribution (mean 0, variance 1)
function randomNormalDistribution() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function formatMoney(number: number) {
  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default App;
