// Test script to verify the pricing calculation
// Run with: node test-calculation.js

const USD_PER_INR = 85.0;
const SEND_RATE_PER_CFT = 7.0;
const LOCAL_MARKUP = 0.05;
const DUTY_RATE = 0.25;

const AA = 0.15; // returns
const AB = (1 - AA) * 0.15 + 0.03 * AA; // selling fees
const AC = 0.25; // ads
const AD = 0.15; // operating margin
const AF = 1.0 - (AA + AB + AC + AD); // [L+FBA]/GrossSales %

function theoreticalListingPrice(l, b, h, weightLbs, factoryInr) {
  const cft = (l * b * h) / (12 ** 3);
  const exUsd = factoryInr / USD_PER_INR;
  const send = SEND_RATE_PER_CFT * cft;
  const duty = exUsd * (1 + LOCAL_MARKUP) * DUTY_RATE;
  const landed = exUsd + send + duty;

  const dimWeight = Math.ceil((l * b * h) / 139.0);
  const shippingWeight = Math.max(weightLbs, dimWeight);

  const longest = Math.max(l, b, h);
  const dimsSorted = [l, b, h].sort((x, y) => x - y);
  const medianDim = dimsSorted[1];
  const shortest = dimsSorted[0];

  let p;
  if (shippingWeight < 1) p = 1;
  else if (shippingWeight < 20) p = 2;
  else if (shippingWeight < 50) p = 3;
  else if (shippingWeight < 70) p = 5;
  else if (shippingWeight < 150) p = 6;
  else p = 7;

  let q;
  if (longest < 15) q = 1;
  else if (longest < 18) q = 2;
  else if (longest < 59) q = 3;
  else q = 4;

  let r;
  if (medianDim < 0.12) r = 1;
  else if (medianDim < 14) r = 2;
  else if (medianDim < 33) r = 3;
  else r = 4;

  let s;
  if (shortest < 0.75) s = 1;
  else if (shortest < 8) s = 2;
  else if (shortest < 33) s = 3;
  else s = 4;

  let tierCode = Math.max(p, q, r, s);
  if (tierCode === 1) tierCode = 2;

  const SHIPPING_TIERS = {
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

// Test case from user
const testInput = {
  length: 14.0,
  breadth: 14.0,
  height: 26.0,
  weight: 11.9,
  factoryPrice: 1250
};

const result = theoreticalListingPrice(
  testInput.length,
  testInput.breadth,
  testInput.height,
  testInput.weight,
  testInput.factoryPrice
);

const rounded = Math.round(result * 100) / 100;

console.log('\n=== Price Calculator Test ===\n');
console.log('Input:');
console.log(`  Length: ${testInput.length} in`);
console.log(`  Breadth: ${testInput.breadth} in`);
console.log(`  Height: ${testInput.height} in`);
console.log(`  Weight: ${testInput.weight} lbs`);
console.log(`  Factory Price: ₹${testInput.factoryPrice}`);
console.log('\nResult:');
console.log(`  Theoretical Listing Price: $${rounded}`);
console.log('\nExpected: $199.81');
console.log(`Status: ${rounded === 199.81 ? '✅ PASS' : '❌ FAIL'}`);
console.log('');
