import { useEffect, useState } from "react";
import {
  Slider,
  SliderFillTrack,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "./components/ui/slider";
import { Label } from "./components/ui/label";
import { cn } from "./lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { useDebounce } from "@uidotdev/usehooks";

const currentPlanYear = 2023;
const years = new Array(30).fill(0).map((_, i) => i + 1);

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const [price, setPrice] = useState(Number(searchParams.get("price")) || 100);
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
    debouncedPrice,
    debouncedInitialShares,
    debouncedAnnualShares,
    debouncedGrowthRate,
    debouncedVolitiliy,
  ] = useDebounce(
    [price, initialShares, annualShares, annualGrowthRate, annualVolatility],
    500,
  );

  useEffect(() => {
    const simulationResults = years.reduce((acc, year) => {
      const results = monteCarloSimulation(
        debouncedPrice,
        debouncedAnnualShares,
        year,
        debouncedGrowthRate / 100,
        debouncedVolitiliy / 100,
        1000,
        debouncedInitialShares,
      ).toSorted((a, b) => a - b);
      const percentile20 = results[Math.floor(results.length * 0.25)];
      const percentile50 = results[Math.floor(results.length * 0.5)];
      const percentile80 = results[Math.floor(results.length * 0.75)];

      console.log(results);

      return [...acc, [year, percentile20, percentile50, percentile80]];
    }, [] as number[][]);

    const searchParams = new URLSearchParams();
    searchParams.set("price", debouncedPrice.toString());
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
    debouncedPrice,
    debouncedInitialShares,
    debouncedAnnualShares,
    debouncedGrowthRate,
    debouncedVolitiliy,
  ]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20">
      <div className="max-w-xl flex flex-col gap-8">
        <SliderInput
          label="Price"
          maxValue={1000}
          minValue={0}
          step={1}
          value={price}
          onChange={setPrice}
        />
        <SliderInput
          label="2023 Shares"
          maxValue={1000}
          minValue={0}
          step={1}
          value={initialShares}
          onChange={setInitialShares}
        />
        <SliderInput
          label="Annual Shares"
          maxValue={150}
          minValue={20}
          step={1}
          value={annualShares}
          onChange={setAnnualShares}
        />
        <SliderInput
          label="Annual Growth Rate"
          maxValue={30}
          minValue={-5}
          step={1}
          value={annualGrowthRate}
          onChange={setAnnualGrowthRate}
        />
        <SliderInput
          label="Annual Volility"
          maxValue={50}
          minValue={0}
          step={1}
          value={annualVolatility}
          onChange={setAnnualVolatility}
        />
      </div>

      <div className="my-12">
        <Table>
          <TableCaption>Monte Carlo Simulation</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Year</TableHead>
              <TableHead>Total Shares</TableHead>
              <TableHead className="text-right">Median Price</TableHead>
              <TableHead className="text-right">20th Percentile</TableHead>
              <TableHead className="text-right">50th Percentile</TableHead>
              <TableHead className="text-right">80th Percentile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold">{currentPlanYear}</TableCell>
              <TableCell className="font-bold">
                {debouncedInitialShares}
              </TableCell>
              <TableCell className="text-right font-bold font-mono">
                {formatMoney(debouncedPrice)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatMoney(debouncedInitialShares * debouncedPrice)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatMoney(debouncedInitialShares * debouncedPrice)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatMoney(debouncedInitialShares * debouncedPrice)}
              </TableCell>
            </TableRow>
            {simulation.map(
              ([year, percentile20, percentile50, percentile80]) => (
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
                    {formatMoney(percentile20)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(percentile50)}
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {formatMoney(percentile80)}
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
function SliderInput({
  maxValue,
  minValue,
  value,
  step,
  label,
  onChange,
}: SliderProps) {
  return (
    <Slider
      aria-label="slider demo"
      value={value}
      onChange={(value) => {
        if (Array.isArray(value)) {
          onChange(value[0]);
        } else {
          onChange(value);
        }
      }}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
      className={cn("w-96")}
    >
      <div className="flex w-full flex-col">
        <div className="flex justify-between">
          <Label>{label}</Label>
          <SliderOutput className="text-sm" />
        </div>
        <SliderTrack>
          <SliderFillTrack />
          <SliderThumb />
        </SliderTrack>
      </div>
    </Slider>
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
      const growth = (annualGrowthRate - annualVolatility ** 2 / 2) * 1;
      const randomShock = annualVolatility * Math.sqrt(1) * getRandomNormal();
      price = price * Math.exp(growth + randomShock);

      portfolioValue = totalShares * price;
    }

    results.push(portfolioValue);
  }

  return results;
}

// Helper function to generate random numbers with a normal distribution (mean 0, variance 1)
function getRandomNormal() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function formatMoney(number: number) {
  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default App;
