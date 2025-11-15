# n8n Quick Setup Guide

## Option 1: Install and Run n8n Locally

### Step 1: Install n8n

```bash
npm install -g n8n
```

### Step 2: Start n8n

```bash
n8n start
```

n8n will be available at: http://localhost:5678

### Step 3: Import Workflow

1. Open n8n UI: http://localhost:5678
2. Click "Workflows" in the sidebar
3. Click "Import from File"
4. Select `n8n-workflow.json` from the project directory
5. The workflow will be imported

### Step 4: Add OpenAI API Credentials

1. In n8n, click "Credentials" in the sidebar
2. Click "Add Credential"
3. Search for "OpenAI API"
4. Enter your API key:
   ```
   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
   ```
5. Name it "OpenAI API" (or any name)
6. Save

### Step 5: Connect Credentials to Workflow

1. Open the imported workflow
2. Click on each OpenAI node (Script, Caption, Hashtags)
3. In the credentials dropdown, select "OpenAI API"
4. Save the workflow

### Step 6: Activate Workflow

1. Toggle the workflow to "Active" (top right)
2. The webhook URL will be shown
3. Copy the webhook URL (should be: `http://localhost:5678/webhook/generate-content`)

### Step 7: Test Workflow

Test with curl:

```bash
curl -X POST http://localhost:5678/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "test-123",
    "topicName": "Understanding CPTSD",
    "topicSlug": "understanding-cptsd",
    "postType": "CAROUSEL",
    "rawIdea": "Create a post explaining what CPTSD is",
    "tone": "educational",
    "finchScreenshotUrl": null
  }'
```

Expected response:

```json
{
  "script": "Generated script text...",
  "caption": "Generated caption text...",
  "hashtags": ["#CPTSD", "#MentalHealth", ...],
  "ai_background_urls": [],
  "zip_url": ""
}
```

### Step 8: Update CMS Configuration

Ensure `.env.local` has:

```env
N8N_BASE_URL="http://localhost:5678"
```

## Option 2: Use n8n Cloud Starter

### Step 1: Access Your n8n Cloud Instance

1. Log in to your n8n cloud starter account
2. Access your n8n instance

### Step 2: Import Workflow

1. In n8n cloud, click "Workflows"
2. Click "Import from File"
3. Upload `n8n-workflow.json`
4. The workflow will be imported

### Step 3: Add OpenAI API Credentials

1. In n8n cloud, click "Credentials"
2. Click "Add Credential"
3. Search for "OpenAI API"
4. Enter your API key
5. Save

### Step 4: Connect Credentials

1. Open the workflow
2. Connect OpenAI credentials to each OpenAI node
3. Save the workflow

### Step 5: Activate and Get Webhook URL

1. Activate the workflow
2. Copy the webhook URL (will be your cloud instance URL)
3. Example: `https://your-instance.n8n.cloud/webhook/generate-content`

### Step 6: Update CMS Configuration

Update `.env.local`:

```env
N8N_BASE_URL="https://your-instance.n8n.cloud"
```

## Workflow Structure

The workflow includes:

1. **Webhook Node** - Receives POST requests from CMS
2. **OpenAI Script Node** - Generates script content
3. **OpenAI Caption Node** - Generates social media caption
4. **OpenAI Hashtags Node** - Generates relevant hashtags
5. **Process Response Node** - Formats response
6. **Respond to Webhook Node** - Returns JSON response

## Troubleshooting

### Workflow Not Receiving Requests

1. Check workflow is activated
2. Verify webhook URL is correct
3. Check n8n is running (for local)
4. Verify firewall/network settings

### OpenAI API Errors

1. Verify API key is correct
2. Check API quota/limits
3. Verify model names are correct
4. Check API key permissions

### Response Format Errors

1. Check workflow execution logs
2. Verify all nodes are connected
3. Check response format matches expected structure
4. Review error messages in n8n

## Testing

### Test from CMS

1. Create a topic in CMS
2. Create a post with a raw idea
3. Click "Generate with AI" button
4. Verify content is generated

### Test with curl

```bash
curl -X POST http://localhost:5678/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "test-123",
    "topicName": "Understanding CPTSD",
    "topicSlug": "understanding-cptsd",
    "postType": "CAROUSEL",
    "rawIdea": "Create a post explaining what CPTSD is",
    "tone": "educational",
    "finchScreenshotUrl": null
  }'
```

## Next Steps

1. ✅ Install/Start n8n
2. ✅ Import workflow
3. ✅ Add OpenAI credentials
4. ✅ Activate workflow
5. ✅ Test workflow
6. ✅ Update CMS configuration
7. ✅ Test from CMS

## Support

- n8n Documentation: https://docs.n8n.io
- OpenAI API Documentation: https://platform.openai.com/docs
- Workflow file: `n8n-workflow.json`
