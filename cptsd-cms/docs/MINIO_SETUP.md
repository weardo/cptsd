# MinIO Bucket Setup Guide

## Bucket Policy Set via CLI ✅

The bucket `cptsd-cms` has been configured with public read access (download policy) using the MinIO CLI.

## How to Set Bucket Policy in MinIO Console UI

If you need to change it in the future, here's how to find it in the UI:

1. **Access MinIO Console**: http://localhost:9001
2. **Login**: `minioadmin` / `minioadmin`
3. **Navigate to Buckets**: Click on "Buckets" in the left sidebar
4. **Select Your Bucket**: Click on `cptsd-cms`
5. **Access Policy Settings**:

   - Click on the "Access Rules" tab (or "Policy" tab depending on MinIO version)
   - OR look for a "Policy" or "Access Policy" button/section
   - OR click on the three dots (⋯) menu next to the bucket name and look for "Access Policy" or "Set Access Policy"

6. **Set Policy**:
   - For public read access: Select "Public" or "download" policy
   - This allows anyone to read/download files but not upload/delete

## Current Policy (Set via CLI)

The bucket is currently set to `download` policy, which means:

- ✅ Public read access (files can be accessed via URL)
- ❌ No public write/delete access

## Testing the Setup

You can test if the bucket is accessible by:

```bash
# Check if bucket exists and is accessible
docker-compose exec minio mc ls myminio/cptsd-cms

# Test upload (from app will work with credentials)
# Test public access URL format
```

## Alternative: Using MinIO CLI

If you prefer using CLI (already done), here are the commands:

```bash
# Set alias (one-time setup)
docker-compose exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Set bucket to public read (download)
docker-compose exec minio mc anonymous set download myminio/cptsd-cms

# Check current policy
docker-compose exec minio mc anonymous get myminio/cptsd-cms

# Available policies:
# - download: Public read access
# - public: Public read/write access
# - none: No public access (default)
```

## File Access URLs

Files uploaded to the bucket will be accessible at:

```
http://localhost:9000/cptsd-cms/<file-path>
```

For example:

```
http://localhost:9000/cptsd-cms/finch-screenshots/abc123.jpg
```

This is the URL format that will be stored in your database when you upload files.

## Production Setup

For production with n8n cloud starter:

- Use your production S3-compatible service (AWS S3, DigitalOcean Spaces, etc.)
- Update `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_BUCKET_NAME` in your `.env` file
- Ensure bucket has appropriate CORS settings if accessing from a web browser
- Set bucket policy according to your security requirements
