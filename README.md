# Price Calculator

A complete full-stack price calculator application with a Supabase Edge Function backend and static frontend suitable for GitHub Pages.

## Overview

This project consists of:
- **Backend**: Supabase Edge Function (Deno/TypeScript) that handles all pricing calculations server-side
- **Frontend**: Static HTML page with inline CSS and JavaScript that can be hosted on GitHub Pages

**Important**: All business logic is kept server-side. The frontend only sends inputs and displays the final calculated price.

## Project Structure

```
price-calculator/
├── README.md
├── frontend/
│   └── index.html          # Static frontend (ready for GitHub Pages)
└── supabase/
    └── functions/
        └── price-calculator/
            └── index.ts    # Edge Function with pricing logic
```

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A [Supabase account](https://supabase.com) (free tier works fine)
- A GitHub account (for hosting the frontend)

## Part 1: Deploy the Supabase Edge Function

### Step 1: Install Supabase CLI (if needed)

```bash
npm install -g supabase
```

Or use other installation methods from the [Supabase CLI docs](https://supabase.com/docs/guides/cli/getting-started).

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 3: Link to your Supabase project

If you haven't created a project yet:
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the project details and create it

Then link your local project:

```bash
# Navigate to the project directory
cd price-calculator

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID (found in your project settings).

**Alternatively**, if you want to initialize Supabase locally first:

```bash
cd price-calculator
supabase init
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 4: Deploy the Edge Function

```bash
supabase functions deploy price-calculator
```

After deployment, you'll see output like:

```
Deployed Function price-calculator on project YOUR_PROJECT_REF
...
```

### Step 5: Get your Function URL

Your function URL will be:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/price-calculator
```

You can also find it in your Supabase Dashboard:
1. Go to your project dashboard
2. Navigate to **Edge Functions** in the sidebar
3. Click on **price-calculator**
4. Copy the function URL

### Step 6: Test the Function (Optional)

You can test the function using curl:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/price-calculator \
  -H "Content-Type: application/json" \
  -d '{
    "length_in": 10,
    "breadth_in": 8,
    "height_in": 6,
    "weight_lb": 5,
    "factory_inr": 1000
  }'
```

You should get a response like:

```json
{"theoretical_listing_price": 45.67}
```

## Part 2: Deploy the Frontend to GitHub Pages

### Step 1: Update the API URL

1. Open `frontend/index.html`
2. Find the line near the top of the `<script>` section:
   ```javascript
   const API_URL = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/price-calculator";
   ```
3. Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID

### Step 2: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
   - Name it whatever you like (e.g., `price-calculator`)
   - Make it public (required for free GitHub Pages)
   - Don't initialize with README (we already have files)

### Step 3: Push Frontend Files to GitHub

You have two options:

#### Option A: Frontend files at repository root (simplest)

```bash
# Create a new git repository in the frontend folder
cd frontend
git init
git add index.html
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### Option B: Whole project in repository (if you want to keep backend code too)

```bash
# Create a new git repository in the project root
cd price-calculator
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

If using Option B, you'll need to configure GitHub Pages to use the `frontend` folder.

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - **Option A users**: Branch: `main`, Folder: `/ (root)`
   - **Option B users**: Branch: `main`, Folder: `/frontend`
5. Click **Save**

### Step 5: Access Your Site

After a few minutes, your site will be available at:

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

(If Option A, the URL is as above. If Option B and you selected `/frontend`, it will be the same.)

GitHub will show you the exact URL in the Pages settings.

## Usage

### Manual Input

1. Enter product dimensions (length, breadth, height in inches)
2. Enter weight in pounds
3. Enter factory price in Indian Rupees (INR)
4. Click "Calculate Price"
5. View the theoretical listing price in USD

### Paste from Excel

1. In Excel, select 5 cells in a row: Length, Breadth, Height, Weight, Factory Price
2. Copy (Ctrl+C or Cmd+C)
3. Click in the "Paste from Excel" text area
4. Paste (Ctrl+V or Cmd+V)
5. The calculator will automatically populate fields and calculate

## How It Works

### Backend (Edge Function)

The Edge Function receives product dimensions, weight, and factory price, then:

1. Calculates shipping costs based on dimensional weight and FBA tier
2. Applies currency conversion (INR to USD)
3. Factors in duties, markup, returns, fees, ads, and operating margin
4. Returns the theoretical listing price

**All pricing logic is kept server-side** to protect business formulas.

### Frontend

The frontend:
- Collects user input
- Sends data to the Supabase Edge Function via POST request
- Displays only the final calculated price
- Never exposes or hints at the pricing formula

## Pricing Formula Details

The server uses these calculations (kept private from the client):

- **Currency conversion**: INR to USD at 85.0 rate
- **Shipping**: Based on dimensional weight and FBA tier system
- **Costs included**:
  - Factory cost (ex-works)
  - International shipping (per cubic foot)
  - Duties (25% of landed value)
  - FBA fees (tier-based)
  - Returns (15%)
  - Selling fees (~15%)
  - Advertising (25%)
  - Operating margin (15%)

## Security Notes

- The Edge Function has CORS enabled for all origins (`*`)
- **Before production**: Update CORS headers in `supabase/functions/price-calculator/index.ts` to only allow your domain:
  ```typescript
  "Access-Control-Allow-Origin": "https://YOUR_USERNAME.github.io"
  ```
- Consider adding authentication if needed

## Customization

### Update Pricing Constants

Edit `supabase/functions/price-calculator/index.ts`:

```typescript
const USD_PER_INR = 85.0;          // Currency rate
const SEND_RATE_PER_CFT = 7.0;     // Shipping per cubic foot
const LOCAL_MARKUP = 0.05;          // Markup percentage
const DUTY_RATE = 0.25;             // Duty rate
const AA = 0.15;                    // Returns rate
const AC = 0.25;                    // Ad spend rate
const AD = 0.15;                    // Operating margin
```

After changes, redeploy:

```bash
supabase functions deploy price-calculator
```

### Style Customization

Edit the `<style>` section in `frontend/index.html` to change colors, fonts, layout, etc.

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
- Verify the function URL is correct in `index.html`
- Check that the Edge Function is deployed successfully
- Ensure CORS headers are set in the Edge Function

### Function Not Found (404)

- Verify your project reference ID is correct
- Ensure the function was deployed successfully: `supabase functions list`
- Check the function URL format: `https://PROJECT_REF.supabase.co/functions/v1/price-calculator`

### GitHub Pages Not Loading

- Wait a few minutes after enabling Pages (it can take 5-10 minutes initially)
- Check the Pages settings show "Your site is live at..."
- Verify `index.html` is in the correct location (root or `/frontend` based on your settings)

## License

This project is provided as-is for your use.

## Support

For Supabase-related issues, see the [Supabase Documentation](https://supabase.com/docs).

For GitHub Pages issues, see the [GitHub Pages Documentation](https://docs.github.com/en/pages).
