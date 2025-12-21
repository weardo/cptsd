# CPTSD Worker Service

Background job processor for journal app. Processes entry analysis and weekly insight generation jobs.

## Quick Start

### 1. Set up environment variables

Create a `.env.local` file in this directory:

```bash
cd services/worker
cp .env.local.example .env.local
# Edit .env.local with your values
```

**Required variables:**

- `MONGODB_URI` - MongoDB connection string (must use `cptsd-journal` database)
- `OPENAI_API_KEY` - Your OpenAI API key

**Optional variables:**

- `OPENAI_MODEL` - Model to use (defaults to `gpt-4o-mini`)
- `OPENAI_BASE_URL` - Custom OpenAI endpoint (optional)

### 2. Install dependencies

```bash
npm install
```

### 3. Start the worker

**Option A: Using the start script (recommended)**

```bash
./start.sh
```

**Option B: Using npm directly**

```bash
npm run dev
```

**Option C: Manual start with env vars**

```bash
MONGODB_URI="your-uri" OPENAI_API_KEY="your-key" npm run dev
```

## How It Works

1. Polls MongoDB for pending jobs every 5 seconds
2. Claims jobs atomically (prevents duplicate processing)
3. Processes jobs:
   - `ENTRY_ANALYSIS`: Analyzes journal entries
   - `WEEKLY_INSIGHT`: Generates weekly insights
4. Retries failed jobs with exponential backoff
5. Marks jobs as DONE or FAILED

## Job Status

- `PENDING`: Waiting to be processed
- `RUNNING`: Currently being processed
- `DONE`: Successfully completed
- `FAILED`: Failed after max attempts

## Monitoring

Check job status via API:

```bash
curl http://localhost:3003/api/v1/jobs/status
```

Or check MongoDB directly:

```bash
mongosh "your-mongodb-uri"
use cptsd-journal
db.jobs.find().sort({createdAt: -1}).limit(10)
```

## Troubleshooting

### Worker not processing jobs

- Check if worker is running: `ps aux | grep tsx`
- Check MongoDB connection (worker logs will show connection status)
- Check OpenAI API key is valid
- Check job status in database (should be `PENDING` with `runAt <= now`)

### Jobs stuck in RUNNING

- Jobs have a 5-minute lock timeout
- Stuck jobs will be reclaimed after timeout
- Check `lockedAt` field in database

### Module not found errors

- Run `npm run postinstall` to copy shared packages
- Check that `node_modules/@cptsd/db` and `node_modules/@cptsd/ai` exist
