# Start n8n - Quick Guide

## n8n is Installed ✅

n8n version: 1.119.2

## Starting n8n

### Option 1: Start in Terminal (Recommended)

```bash
n8n start
```

This will:

- Start n8n server on http://localhost:5678
- Open browser automatically (or access manually)
- Show setup wizard on first run

### Option 2: Start in Background

```bash
n8n start > /tmp/n8n.log 2>&1 &
```

Then access: http://localhost:5678

## First Time Setup

1. **Access n8n UI:**

   - Open http://localhost:5678
   - You'll see the setup wizard

2. **Create Account:**

   - Enter your email
   - Create a password
   - Complete setup

3. **Import Workflow:**

   - Click "Workflows" in sidebar
   - Click "Import from File"
   - Select `n8n-workflow.json`
   - Workflow will be imported

4. **Add OpenAI Credentials:**

   - Click "Credentials" in sidebar
   - Click "Add Credential"
   - Search for "OpenAI API"
   - Enter API key: `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`
   - Name it "OpenAI API"
   - Save

5. **Connect Credentials to Workflow:**

   - Open the imported workflow
   - Click on each OpenAI node (Script, Caption, Hashtags)
   - Select "OpenAI API" from credentials dropdown
   - Save workflow

6. **Activate Workflow:**
   - Toggle workflow to "Active" (top right)
   - Webhook URL will be displayed
   - Should be: `http://localhost:5678/webhook/generate-content`

## Testing

### Test from Terminal:

```bash
./test-n8n-workflow.sh
```

### Test from Browser:

Visit: http://localhost:5678/webhook/generate-content

(Will show webhook information)

### Test from CMS:

1. Create a post in CMS
2. Click "Generate with AI" button
3. Verify content is generated

## Configuration

Ensure `.env.local` has:

```env
N8N_BASE_URL="http://localhost:5678"
```

## Troubleshooting

### n8n Not Starting

1. Check if port 5678 is available:

   ```bash
   lsof -i :5678
   ```

2. Check n8n logs:

   ```bash
   tail -f /tmp/n8n.log
   ```

3. Try different port:
   ```bash
   n8n start --port 5679
   ```

### Workflow Not Working

1. Check workflow is activated
2. Verify credentials are connected
3. Check workflow execution logs
4. Verify webhook URL is correct

### OpenAI API Errors

1. Verify API key is correct
2. Check API quota
3. Verify model names
4. Check API key permissions

## Next Steps

1. ✅ Start n8n
2. ✅ Import workflow
3. ✅ Add OpenAI credentials
4. ✅ Activate workflow
5. ✅ Test workflow
6. ✅ Test from CMS

## Files

- `n8n-workflow.json` - Workflow definition
- `N8N_QUICK_SETUP.md` - Detailed setup guide
- `test-n8n-workflow.sh` - Test script
- `START_N8N.md` - This file

## Support

- n8n Documentation: https://docs.n8n.io
- Workflow file: `n8n-workflow.json`
- Test script: `./test-n8n-workflow.sh`
