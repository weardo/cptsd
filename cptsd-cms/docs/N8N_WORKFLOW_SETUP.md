# n8n Workflow Setup Guide

## Overview

This guide explains how to set up the n8n workflow for AI content generation that integrates with the CPTSD CMS.

## Workflow Requirements

### Webhook Endpoint

- **Path:** `/webhook/generate-content`
- **Method:** `POST`
- **Content-Type:** `application/json`

### Request Format

The CMS will send a POST request with the following JSON:

```json
{
  "postId": "string",
  "topicName": "string",
  "topicSlug": "string",
  "postType": "CAROUSEL" | "REEL" | "STORY" | "MEME",
  "rawIdea": "string",
  "tone": "educational" | "validating" | "gentle-cta",
  "finchScreenshotUrl": "string | null"
}
```

### Expected Response Format

The workflow must return a JSON response with:

```json
{
  "script": "string",
  "caption": "string",
  "hashtags": "string[] | string",
  "ai_background_urls": "string[]",
  "zip_url": "string"
}
```

## Step-by-Step Workflow Setup

### 1. Create New Workflow in n8n

1. Open your n8n instance (local or cloud)
2. Click "New Workflow"
3. Name it "Generate Content for CPTSD CMS"

### 2. Add Webhook Node

1. Add a "Webhook" node
2. Configure:
   - **HTTP Method:** POST
   - **Path:** `generate-content`
   - **Response Mode:** "Respond to Webhook"
   - **Response Data:** "All Incoming Items"

### 3. Add OpenAI Node (for Script Generation)

1. Add an "OpenAI" node after the Webhook
2. Configure:

   - **Operation:** "Create Chat Completion"
   - **Model:** `gpt-4` or `gpt-3.5-turbo`
   - **Messages:**
     ```json
     [
       {
         "role": "system",
         "content": "You are a content creator specializing in CPTSD awareness. Create engaging, educational, and validating content for social media posts."
       },
       {
         "role": "user",
         "content": "Topic: {{ $json.topicName }}\nPost Type: {{ $json.postType }}\nTone: {{ $json.tone }}\nRaw Idea: {{ $json.rawIdea }}\n\nCreate a script for this content following the tone: {{ $json.tone }}"
       }
     ]
     ```
   - **Temperature:** 0.7
   - **Max Tokens:** 2000

3. **Add Credentials:**
   - Click "Create New Credential"
   - Type: "OpenAI API"
   - API Key: `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`
   - Save

### 4. Add OpenAI Node (for Caption Generation)

1. Add another "OpenAI" node
2. Configure:
   - **Operation:** "Create Chat Completion"
   - **Model:** `gpt-4` or `gpt-3.5-turbo`
   - **Messages:**
     ```json
     [
       {
         "role": "system",
         "content": "You are a social media content creator. Create engaging captions for CPTSD awareness posts."
       },
       {
         "role": "user",
         "content": "Topic: {{ $json.topicName }}\nPost Type: {{ $json.postType }}\nTone: {{ $json.tone }}\nRaw Idea: {{ $json.rawIdea }}\nScript: {{ $('OpenAI').item.json.choices[0].message.content }}\n\nCreate a social media caption for this post with tone: {{ $json.tone }}"
       }
     ]
     ```
   - **Temperature:** 0.7
   - **Max Tokens:** 1000

### 5. Add OpenAI Node (for Hashtags)

1. Add another "OpenAI" node
2. Configure:
   - **Operation:** "Create Chat Completion"
   - **Model:** `gpt-3.5-turbo`
   - **Messages:**
     ```json
     [
       {
         "role": "system",
         "content": "You are a social media expert. Generate relevant hashtags for CPTSD awareness content."
       },
       {
         "role": "user",
         "content": "Topic: {{ $json.topicName }}\nPost Type: {{ $json.postType }}\nCaption: {{ $('OpenAI (Caption)').item.json.choices[0].message.content }}\n\nGenerate 10-15 relevant hashtags as a JSON array."
       }
     ]
     ```
   - **Temperature:** 0.5
   - **Max Tokens:** 200

### 6. Add Code Node (Optional - for Image Generation)

If you want to generate AI background images:

1. Add a "Code" node
2. Configure to call an image generation API (DALL-E, Stable Diffusion, etc.)
3. Return URLs in an array format

### 7. Add Respond to Webhook Node

1. Add a "Respond to Webhook" node at the end
2. Configure:
   - **Response Body:**
     ```json
     {
       "script": "{{ $('OpenAI (Script)').item.json.choices[0].message.content }}",
       "caption": "{{ $('OpenAI (Caption)').item.json.choices[0].message.content }}",
       "hashtags": {{ $('OpenAI (Hashtags)').item.json.choices[0].message.content }},
       "ai_background_urls": [],
       "zip_url": ""
     }
     ```

### 8. Handle Hashtags Format

Add a "Code" node to parse hashtags:

```javascript
// Parse hashtags from OpenAI response
const hashtagsResponse = $input.item.json.choices[0].message.content;
let hashtags;

try {
  // Try to parse as JSON array
  hashtags = JSON.parse(hashtagsResponse);
} catch (e) {
  // If not JSON, split by lines or commas
  hashtags = hashtagsResponse
    .split('\n')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

return {
  json: {
    hashtags: hashtags,
  },
};
```

## Complete Workflow Structure

```
Webhook (POST /generate-content)
  ↓
OpenAI (Script Generation)
  ↓
OpenAI (Caption Generation)
  ↓
OpenAI (Hashtags Generation)
  ↓
Code (Parse Hashtags) [Optional]
  ↓
Code (Generate Images) [Optional]
  ↓
Respond to Webhook (Return JSON)
```

## Testing the Workflow

### Test with curl:

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

### Expected Response:

```json
{
  "script": "CPTSD, or Complex Post-Traumatic Stress Disorder, is...",
  "caption": "Understanding CPTSD: A guide to recognizing and healing...",
  "hashtags": ["#CPTSD", "#MentalHealth", "#Healing", ...],
  "ai_background_urls": [],
  "zip_url": ""
}
```

## Environment Variables

If using n8n cloud, you can store the OpenAI API key as an environment variable:

1. Go to n8n Settings > Credentials
2. Create OpenAI API credential
3. Use the API key: `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`

## Advanced Features

### 1. Image Generation

Add DALL-E or Stable Diffusion integration:

- Generate background images based on topic
- Return URLs in `ai_background_urls` array

### 2. Zip File Generation

If generating multiple assets:

- Create a zip file with scripts, images, etc.
- Upload to S3 or storage
- Return URL in `zip_url`

### 3. Error Handling

Add error handling nodes:

- Try-Catch blocks
- Fallback responses
- Logging

## Configuration

### For Local n8n:

- URL: `http://localhost:5678`
- Update `.env.local`: `N8N_BASE_URL="http://localhost:5678"`

### For n8n Cloud:

- URL: Your n8n cloud instance URL
- Update `.env.local`: `N8N_BASE_URL="https://your-instance.n8n.cloud"`

## Troubleshooting

### Common Issues:

1. **Webhook not receiving requests:**

   - Check n8n is running
   - Verify webhook path is correct
   - Check firewall/network settings

2. **OpenAI API errors:**

   - Verify API key is correct
   - Check API quota/limits
   - Verify model name is correct

3. **Response format errors:**
   - Ensure response matches expected format
   - Check JSON structure
   - Verify all required fields are present

## Security Notes

⚠️ **Important:**

- Never commit API keys to version control
- Store API keys in environment variables
- Use n8n credential management for API keys
- Rotate API keys regularly
- Monitor API usage

## Next Steps

1. Create the workflow in n8n
2. Test with sample data
3. Activate the workflow
4. Test from the CMS application
5. Monitor and refine as needed

## Support

For issues or questions:

- Check n8n documentation: https://docs.n8n.io
- Check OpenAI API documentation: https://platform.openai.com/docs
- Review workflow logs in n8n
