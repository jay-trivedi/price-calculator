import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const USD_PER_INR = 85.0;
const SEND_RATE_PER_CFT = 7.0;
const LOCAL_MARKUP = 0.05;
const DEFAULT_DUTY_RATE = 0.15; // 15% default

const AA = 0.15; // returns
const AB = (1 - AA) * 0.15 + 0.03 * AA; // selling fees
const AC = 0.25; // ads
const AD = 0.15; // operating margin
const AF = 1.0 - (AA + AB + AC + AD); // [L+FBA]/GrossSales %

type PriceInput = {
  length_in: number;
  breadth_in: number;
  height_in: number;
  weight_lb: number;
  factory_inr: number;
  duty_rate_percent?: number; // Optional, defaults to 15%
};

type PriceOutput = {
  theoretical_listing_price: number;
};

function theoreticalListingPrice(
  l: number,
  b: number,
  h: number,
  weightLbs: number,
  factoryInr: number,
  dutyRate: number = DEFAULT_DUTY_RATE
): number {
  const cft = (l * b * h) / (12 ** 3);
  const exUsd = factoryInr / USD_PER_INR;
  const send = SEND_RATE_PER_CFT * cft;
  const duty = exUsd * (1 + LOCAL_MARKUP) * dutyRate;
  const landed = exUsd + send + duty;

  const dimWeight = Math.ceil((l * b * h) / 139.0);
  const shippingWeight = Math.max(weightLbs, dimWeight);

  const longest = Math.max(l, b, h);
  const dimsSorted = [l, b, h].sort((x, y) => x - y);
  const medianDim = dimsSorted[1];
  const shortest = dimsSorted[0];

  let p: number;
  if (shippingWeight < 1) p = 1;
  else if (shippingWeight < 20) p = 2;
  else if (shippingWeight < 50) p = 3;
  else if (shippingWeight < 70) p = 5;
  else if (shippingWeight < 150) p = 6;
  else p = 7;

  let q: number;
  if (longest < 15) q = 1;
  else if (longest < 18) q = 2;
  else if (longest < 59) q = 3;
  else q = 4;

  let r: number;
  if (medianDim < 0.12) r = 1;
  else if (medianDim < 14) r = 2;
  else if (medianDim < 33) r = 3;
  else r = 4;

  let s: number;
  if (shortest < 0.75) s = 1;
  else if (shortest < 8) s = 2;
  else if (shortest < 33) s = 3;
  else s = 4;

  let tierCode = Math.max(p, q, r, s);
  if (tierCode === 1) tierCode = 2;

  const SHIPPING_TIERS: Record<number, [number, number, number]> = {
    2: [7.46, 0.32, 3.0],
    3: [10.65, 0.38, 1.0],
    4: [26.33, 0.38, 1.0],
    5: [40.12, 0.75, 51.0],
    6: [54.81, 0.75, 71.0],
    7: [194.95, 0.19, 151.0],
  };

  const [base, incr, cutoff] = SHIPPING_TIERS[tierCode];
  const fba = base + incr * Math.max(0, shippingWeight - cutoff);

  const z = landed + fba;
  return z / AF;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = (await req.json()) as Partial<PriceInput>;

    // Convert duty rate from percentage to decimal (e.g., 15 -> 0.15)
    const dutyRate = body.duty_rate_percent
      ? Number(body.duty_rate_percent) / 100
      : DEFAULT_DUTY_RATE;

    const listing = theoreticalListingPrice(
      Number(body.length_in),
      Number(body.breadth_in),
      Number(body.height_in),
      Number(body.weight_lb),
      Number(body.factory_inr),
      dutyRate
    );

    const result: PriceOutput = {
      theoretical_listing_price: Math.round(listing * 100) / 100,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Invalid input or server error" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
