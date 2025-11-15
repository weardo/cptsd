# Jenkins Environment Variables Setup

If `.env` files are not available in the repository or deployment directory, you can set environment variables directly in Jenkins. This guide shows you two methods.

## Method 1: Job-Level Environment Variables (Recommended)

### For CMS Job (`cptsd-cms`)

1. Go to: https://jenkins.cptsd.in/job/cptsd-cms/configure

2. Scroll to **"Build Environment"** section

3. Check **"Use secret text(s) or file(s)"** (optional, for secrets)
   OR

4. Add environment variables directly:
   - Click **"Add"** under **"Pipeline"** section (if available)
   OR

5. Use **"This project is parameterized"**:
   - Check **"This project is parameterized"**
   - Click **"Add Parameter"** → **"String Parameter"**
   - Add each required variable:
     - Name: `OPENAI_API_KEY`
     - Default Value: (leave empty or set default)
     - Description: `OpenAI API Key for content generation`
   
   Repeat for all required variables:
   - `OPENAI_API_KEY`
   - `MONGODB_URI`
   - `S3_ENDPOINT`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`

6. Click **"Save"**

### For Blog Job (`cptsd-blog-public`)

1. Go to: https://jenkins.cptsd.in/job/cptsd-blog-public/configure

2. Check **"This project is parameterized"**

3. Add parameter:
   - Name: `MONGODB_URI`
   - Default Value: (your MongoDB connection string)
   - Description: `MongoDB connection URI`

4. Click **"Save"**

## Method 2: Global Environment Variables (System-Wide)

1. Go to: https://jenkins.cptsd.in/configure

2. Scroll to **"Global properties"**

3. Check **"Environment variables"**

4. Click **"Add"** for each variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: (your OpenAI API key)
   
   Add all required variables:
   - `OPENAI_API_KEY`
   - `MONGODB_URI`
   - `S3_ENDPOINT`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`

5. Click **"Save"**

## Method 3: Using Credentials (For Secrets)

For sensitive values like API keys and passwords:

1. Go to: https://jenkins.cptsd.in/credentials/store/system/domain/_/

2. Click **"Add Credentials"**

3. Select **"Secret text"**

4. Configure:
   - **Secret**: (paste your API key or password)
   - **ID**: `openai-api-key` (or similar)
   - **Description**: `OpenAI API Key`

5. In the Jenkinsfile, update the environment block to reference credentials:
   ```groovy
   environment {
       OPENAI_API_KEY = credentials('openai-api-key')
   }
   ```

## Priority Order

The Jenkinsfile checks for environment variables in this order:
1. `.env.local` in checked-out repository (`cptsd-cms/.env.local`)
2. `.env` in checked-out repository (`cptsd-cms/.env`)
3. `.env` in deployment directory (`/opt/cptsd-cms/.env`)
4. **Jenkins environment variables** (from job configuration or global properties)
5. Empty string (fallback)

## Testing

After setting environment variables:

1. Go to your job: https://jenkins.cptsd.in/job/cptsd-cms
2. Click **"Build with Parameters"** (if using parameters)
   OR
   Click **"Build Now"** (if using global properties)
3. Check the build console output to see which source was used

## Required Variables

### For CMS (`cptsd-cms`):
- `OPENAI_API_KEY` - OpenAI API key for content generation
- `MONGODB_URI` - MongoDB connection string
- `S3_ENDPOINT` - MinIO/S3 endpoint URL
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `S3_BUCKET_NAME` - S3 bucket name
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Admin user password
- `NEXTAUTH_URL` - NextAuth URL (e.g., https://cms.cptsd.in)
- `NEXTAUTH_SECRET` - NextAuth secret (32+ characters)

### For Blog (`cptsd-blog-public`):
- `MONGODB_URI` - MongoDB connection string

