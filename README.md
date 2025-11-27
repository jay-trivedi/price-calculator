# Price Calculator

A full-stack price calculator application for Amazon FBA products with a Supabase Edge Function backend and static frontend hosted on GitHub Pages.

## Overview

This project calculates theoretical listing prices for Amazon FBA products based on:
- Product dimensions (length, breadth, height in inches)
- Weight (in pounds)
- Factory price (in Indian Rupees)
- Customizable duty rate (default 15%)

The calculator displays:
1. **Approx List Price** - The theoretical selling price on Amazon
2. **Last Mile Shipping Fees** - The FBA fulfillment fees

**Important**: All business logic is kept server-side to protect proprietary pricing formulas.

## Project Structure

```
price-calculator/
├── README.md
├── index.html                    # Main frontend file
├── docs/
│   └── index.html                # GitHub Pages deployment (copy of main index.html)
├── supabase/
│   └── functions/
│       └── price-calculator/
│           ├── index.ts          # Edge Function with pricing logic
│           └── config.toml       # Function configuration (JWT disabled)
├── test-calculation.js           # Local testing script
└── .env                          # Environment variables (not committed)
```

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A [Supabase account](https://supabase.com) (free tier works fine)
- A GitHub account (for hosting the frontend)
- Node.js (for local testing)

## Backend: Supabase Edge Function

### Pricing Formula

The Edge Function calculates prices using these components:

#### Constants
```typescript
USD_PER_INR = 85.0              // Currency conversion rate
SEND_RATE_PER_CFT = 7.0         // International shipping per cubic foot
LOCAL_MARKUP = 0.05              // 5% local markup
DEFAULT_DUTY_RATE = 0.15         // 15% duty (customizable by user)

AA = 0.15                        // Returns (15%)
AB = (1-AA) * 0.15 + 0.03 * AA  // Selling fees (~13.2%)
AC = 0.25                        // Advertising (25%)
AD = 0.15                        // Operating margin (15%)
AF = 1 - (AA + AB + AC + AD)    // Net percentage (~41.55%)
```

#### Calculation Steps

1. **Shipping Costs**:
   - Calculate cubic feet: `(L × B × H) / 1728`
   - International shipping: `CFT × $7.00`

2. **Landed Cost**:
   - Factory cost in USD: `Factory INR / 85.0`
   - Duty: `(Factory USD × 1.05) × duty_rate`
   - Landed: `Factory USD + Shipping + Duty`

3. **FBA Fees** (based on shipping weight and tier):
   - Dimensional weight: `⌈(L × B × H) / 139⌉`
   - Shipping weight: `max(actual weight, dimensional weight)`
   - Tier determination: Based on weight and dimensions
   - FBA fee: `base + increment × max(0, weight - cutoff)`

4. **Final Price**:
   ```
   List Price = (Landed Cost + FBA Fees) / 0.4155
   ```

#### FBA Shipping Tiers

| Tier | Weight Range | Base | Increment | Cutoff |
|------|-------------|------|-----------|--------|
| Small Standard | < 1 lb | $7.46 | $0.32 | 3 lbs |
| Large Standard | 1-19 lbs | $10.65 | $0.38 | 1 lb |
| Small Oversize | 20-49 lbs | $26.33 | $0.38 | 1 lb |
| Medium Oversize | 50-69 lbs | $40.12 | $0.75 | 51 lbs |
| Large Oversize | 70-149 lbs | $54.81 | $0.75 | 71 lbs |
| Special Oversize | 150+ lbs | $194.95 | $0.19 | 151 lbs |

### API Specification

#### Endpoint
```
POST https://{PROJECT_REF}.supabase.co/functions/v1/price-calculator
```

#### Request Body
```json
{
  "length_in": 14.0,
  "breadth_in": 14.0,
  "height_in": 26.0,
  "weight_lb": 11.9,
  "factory_inr": 1250,
  "duty_rate_percent": 15
}
```

#### Response
```json
{
  "theoretical_listing_price": 194.95,
  "fba_fees": 24.33
}
```

#### Error Response
```json
{
  "error": "Invalid input or server error"
}
```

### Deployment

#### 1. Deploy to Supabase

```bash
# Deploy with project reference
supabase functions deploy price-calculator --project-ref YOUR_PROJECT_REF --no-verify-jwt

# Or if linked to project
supabase functions deploy price-calculator
```

#### 2. Test the Deployment

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/price-calculator" \
  -H "Content-Type: application/json" \
  -d '{
    "length_in": 14.0,
    "breadth_in": 14.0,
    "height_in": 26.0,
    "weight_lb": 11.9,
    "factory_inr": 1250,
    "duty_rate_percent": 15
  }'
```

Expected response:
```json
{"theoretical_listing_price": 194.95, "fba_fees": 24.33}
```

## Frontend: GitHub Pages

### Features

1. **Manual Input**: Enter values in individual form fields
2. **Excel Paste**: Copy 5 tab-separated values (L, B, H, W, Price) and paste
3. **Customizable Duty Rate**: Adjust duty percentage (default 15%)
4. **Real-time Calculation**: Automatic calculation on paste
5. **Results Display**:
   - Approx List Price (larger display)
   - Last Mile Shipping Fees (FBA fees)
6. **Shipping Tier Reference**: Collapsible details about FBA tiers

### Configuration

The API URL is set in `index.html`:
```javascript
const API_URL = "https://ptmhhbdtyffqfexpfxps.supabase.co/functions/v1/price-calculator";
```

Update this to match your Supabase project reference.

### Deployment

#### Current Setup
- **Repository**: `jay-trivedi/price-calculator`
- **GitHub Pages**: Serves from `/docs` folder on `main` branch
- **Live URL**: https://jay-trivedi.github.io/price-calculator/

#### Deploy Updates

```bash
# 1. Update index.html with changes
# 2. Copy to docs folder
cp index.html docs/index.html

# 3. Commit and push
git add index.html docs/index.html
git commit -m "Update frontend"
git push origin main

# GitHub Pages will auto-deploy in 1-2 minutes
```

## Local Testing

### Test Script

Run local calculations without deploying:

```bash
node test-calculation.js
```

This uses the same calculation logic as the backend and outputs:
```
=== Price Calculator Test ===

Input:
  Length: 14 in
  Breadth: 14 in
  Height: 26 in
  Weight: 11.9 lbs
  Factory Price: ₹1250
  Duty Rate: 15%

Results:
  Approx List Price: $194.95
  Last Mile Shipping Fees (FBA): $24.33
```

### Test Cases

| L (in) | B (in) | H (in) | Weight (lbs) | Factory (INR) | List Price | FBA Fees |
|--------|--------|--------|--------------|---------------|------------|----------|
| 14.0 | 14.0 | 26.0 | 11.9 | 1250 | $194.95 | $24.33 |
| 14.5 | 14.5 | 26.5 | 19.0 | 1450 | $214.36 | $25.85 |
| 14.5 | 15.0 | 5.5 | 7.7 | 1150 | $107.54 | $13.69 |

## Usage

### Manual Entry
1. Enter dimensions (L, B, H in inches)
2. Enter weight (pounds)
3. Enter factory price (INR)
4. Optionally adjust duty rate (default 15%)
5. Click "Calculate Price"
6. View list price and FBA fees

### Excel Paste
1. In Excel, select 5 cells: `L | B | H | W | Price`
2. Copy (Ctrl+C / Cmd+C)
3. Click the "Paste from Excel" text area
4. Paste (Ctrl+V / Cmd+V)
5. Calculator auto-populates and calculates

Example Excel data:
```
14.0    14.0    26.0    11.9    1250
14.5    14.5    26.5    19.0    1450
14.5    15.0    5.5     7.7     1150
```

## Customization

### Update Pricing Constants

Edit `supabase/functions/price-calculator/index.ts`:

```typescript
const USD_PER_INR = 85.0;           // Change exchange rate
const SEND_RATE_PER_CFT = 7.0;      // Change shipping cost
const LOCAL_MARKUP = 0.05;          // Change markup
const DEFAULT_DUTY_RATE = 0.15;     // Change default duty

const AA = 0.15;  // Returns
const AC = 0.25;  // Ads
const AD = 0.15;  // Operating margin
```

After changes:
```bash
supabase functions deploy price-calculator --project-ref YOUR_PROJECT_REF
```

### Update FBA Tier Structure

Edit the `SHIPPING_TIERS` object in `index.ts`:
```typescript
const SHIPPING_TIERS: Record<number, [number, number, number]> = {
  2: [7.46, 0.32, 3.0],    // [base, increment, cutoff]
  3: [10.65, 0.38, 1.0],
  // ...
};
```

### Style Customization

Edit the `<style>` section in `index.html`:
```css
/* Change gradient colors */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change button colors */
button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## Security

### CORS Configuration

The function currently allows all origins:
```typescript
"Access-Control-Allow-Origin": "*"
```

**For production**, restrict to your domain:
```typescript
"Access-Control-Allow-Origin": "https://jay-trivedi.github.io"
```

### JWT Verification

JWT verification is disabled in `config.toml`:
```toml
[function.price-calculator]
verify_jwt = false
```

This allows public access without authentication. Enable if you need authentication.

### Environment Variables

The `.env` file contains sensitive data and is gitignored:
```bash
SUPABASE_DB_PASSWORD="..."
```

Never commit this file to version control.

## Troubleshooting

### Backend Issues

**401 Authorization Error:**
- Ensure `verify_jwt = false` in `config.toml`
- Redeploy with: `supabase functions deploy price-calculator --no-verify-jwt`

**Function not found:**
- Verify project reference: `supabase projects list`
- Check deployment: `supabase functions list`

**Calculation errors:**
- Test locally with `node test-calculation.js`
- Check input validation in request

### Frontend Issues

**CORS errors:**
- Verify API_URL matches your Supabase project
- Check CORS headers in Edge Function
- Ensure function deployed successfully

**GitHub Pages not updating:**
- Wait 1-2 minutes for rebuild
- Check Actions tab for deployment status
- Verify `docs/index.html` is updated
- Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)

**Calculation not working:**
- Open browser console (F12) for errors
- Verify API URL is correct
- Test backend directly with curl

### Testing Deployment

Check if frontend is live:
```bash
curl -s https://jay-trivedi.github.io/price-calculator/ | grep "fbaFeesValue"
```

Should return HTML containing `id="fbaFeesValue"` if deployed.

## Development Workflow

### Making Changes

1. **Update Backend:**
   ```bash
   # Edit supabase/functions/price-calculator/index.ts
   # Test locally
   node test-calculation.js
   # Deploy
   supabase functions deploy price-calculator --project-ref YOUR_REF
   ```

2. **Update Frontend:**
   ```bash
   # Edit index.html
   # Copy to docs
   cp index.html docs/index.html
   # Commit and push
   git add index.html docs/index.html
   git commit -m "Update: description"
   git push origin main
   ```

3. **Verify Deployment:**
   ```bash
   # Test backend
   curl -X POST "https://YOUR_REF.supabase.co/functions/v1/price-calculator" \
     -H "Content-Type: application/json" \
     -d '{"length_in":14,"breadth_in":14,"height_in":26,"weight_lb":11.9,"factory_inr":1250,"duty_rate_percent":15}'

   # Check frontend (wait 1-2 min after push)
   open https://jay-trivedi.github.io/price-calculator/
   ```

## Project History

- **Initial version**: Basic price calculator with listing price only
- **Current version**: Added FBA fees display as "Last Mile Shipping Fees"
  - Backend returns both `theoretical_listing_price` and `fba_fees`
  - Frontend displays both values below each other
  - Added customizable duty rate input (default 15%)
  - Updated test script to show both values

## License

This project is provided as-is for your use.

## Support & Resources

- **Supabase Documentation**: https://supabase.com/docs
- **GitHub Pages Documentation**: https://docs.github.com/en/pages
- **Repository**: https://github.com/jay-trivedi/price-calculator
- **Live Demo**: https://jay-trivedi.github.io/price-calculator/
