# Setup Status

## ✅ Completed & Working

1. **MongoDB** - Connected to Atlas cluster

   - Database: `cptsd-cms`
   - Connection: ✅ Working
   - Collections: Auto-created on first use

2. **Authentication** - NextAuth v4

   - Login: ✅ Working
   - Admin user: ✅ Created
   - Session management: ✅ Working

3. **Application Code** - All features implemented
   - ✅ Topic CRUD operations
   - ✅ Post CRUD operations
   - ✅ Search and filtering
   - ✅ File upload interface
   - ✅ n8n integration code
   - ✅ UI components

## ⚠️ Needs Setup

### 1. n8n (for AI Content Generation)

**Current Status:** Code is ready, but n8n instance is not running

**Webhook Endpoint Expected:**

```
POST http://localhost:5678/webhook/generate-content
```

**Request Format:**

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

**Expected Response:**

```json
{
  "script": "string",
  "caption": "string",
  "hashtags": "string[] | string",
  "ai_background_urls": "string[]",
  "zip_url": "string"
}
```

**Setup Options:**

#### Option A: Local n8n (for testing)

```bash
# Install n8n globally
npm install -g n8n

# Run n8n
n8n start
```

#### Option B: n8n Cloud Starter (as you mentioned)

1. Update `.env.local`:
   ```env
   N8N_BASE_URL="https://your-n8n-instance.com"
   ```
2. Create workflow with webhook trigger at `/webhook/generate-content`
3. Configure workflow to generate content and return expected format

**Where to Create Workflow:**

- In your n8n instance, create a new workflow
- Add a "Webhook" node (POST method)
- Set path to `/webhook/generate-content`
- Build your AI generation pipeline
- Return response matching the expected format

**Note:** The app will work fine without n8n - you just won't be able to use the "Generate with AI" button. All CRUD operations work independently.

### 2. MinIO (for File Uploads)

**Current Status:** Code is ready, but MinIO is not running

**Expected URLs:**

- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

**Setup:**

```bash
cd /home/astra/n8n/cptsd-cms

# Start MinIO using docker-compose
docker-compose up -d minio

# Or run MinIO directly
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

**After Starting:**

1. Access console at http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Create bucket: `cptsd-cms`
4. Set bucket policy to public read (for screenshots to be accessible)

**Bucket Policy (for public read):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": ["*"] },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::cptsd-cms/*"]
    }
  ]
}
```

## Testing

### Test CRUD Operations (No Setup Required)

1. Create a topic: http://localhost:3000/topics/new
2. Create a post: http://localhost:3000/posts/new
3. View posts: http://localhost:3000/posts
4. Search and filter: Should work

### Test File Upload (Requires MinIO)

1. Start MinIO
2. Create bucket and set policy
3. Try uploading a Finch screenshot in post detail page

### Test AI Generation (Requires n8n)

1. Setup n8n (local or cloud)
2. Create workflow with webhook
3. Create a post with a raw idea
4. Click "Generate with AI" button

## Configuration

Current `.env.local` settings:

```env
MONGODB_URI="mongodb+srv://dbuser:2aGo3PT2Awvw6ecI@cluster0.hazc9.mongodb.net/cptsd-cms?retryWrites=true&w=majority"
N8N_BASE_URL="http://localhost:5678"  # Change to your n8n cloud URL if using cloud
S3_ENDPOINT="http://localhost:9000"    # Change if using different S3-compatible service
```

## Next Steps

1. **For Development/Testing:**

   - Start MinIO for file uploads
   - Start n8n locally for AI generation testing
   - Or configure n8n cloud starter URL

2. **For Production:**
   - Update `N8N_BASE_URL` to your n8n cloud instance
   - Use production S3 service (or keep MinIO if self-hosting)
   - Update `NEXTAUTH_SECRET` to a secure random string
   - Configure proper environment variables

## Summary

✅ **Core App:** Fully functional  
✅ **Database:** Connected and working  
✅ **Authentication:** Working  
⚠️ **n8n:** Needs setup (local or cloud)  
⚠️ **MinIO:** Needs to be started

The app works independently - you can use all features except AI generation (needs n8n) and file uploads (needs MinIO/S3).
