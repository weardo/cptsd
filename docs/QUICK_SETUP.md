# Quick Jenkins Setup Guide

## Current Situation

- **Jenkins URL**: https://jenkins.cptsd.in
- **Current User**: `astra` (limited permissions - cannot create jobs via API)
- **GitHub Webhook**: ✅ Already configured and working

## Option 1: Manual Job Creation (Easiest)

Since `astra` user doesn't have API permissions, create jobs manually:

### Step 1: Access Jenkins

Go to: https://jenkins.cptsd.in

### Step 2: Create cptsd-cms Job

1. Click **"New Item"** (top left)
2. Enter name: `cptsd-cms`
3. Select **"Pipeline"**
4. Click **OK**

**Configure:**

- **Description**: `CMS Application Pipeline`
- **Build Triggers**: ✅ Check **"GitHub hook trigger for GITScm polling"**
- **Pipeline**:
  - Definition: **Pipeline script from SCM**
  - SCM: **Git**
  - Repository URL: `git@github.com:weardo/cptsd.git`
  - Credentials: `github-ssh-key` (select from dropdown)
  - Branch Specifier: `*/main`
  - Script Path: `cptsd-cms/Jenkinsfile`
- Click **Save**

### Step 3: Create cptsd-blog-public Job

1. Click **"New Item"**
2. Enter name: `cptsd-blog-public`
3. Select **"Pipeline"**
4. Click **OK**

**Configure:**

- **Description**: `Blog Public Application Pipeline`
- **Build Triggers**: ✅ Check **"GitHub hook trigger for GITScm polling"**
- **Pipeline**:
  - Definition: **Pipeline script from SCM**
  - SCM: **Git**
  - Repository URL: `git@github.com:weardo/cptsd.git`
  - Credentials: `github-ssh-key`
  - Branch Specifier: `*/main`
  - Script Path: `cptsd-blog-public/Jenkinsfile`
- Click **Save**

### Step 4: Test

1. Go to job: https://jenkins.cptsd.in/job/cptsd-cms
2. Click **"Build Now"**
3. Watch the build progress

## Option 2: Grant Permissions to astra User

If you want to use the API scripts:

1. Go to: https://jenkins.cptsd.in/configureSecurity/
2. Under **"Authorization"**:
   - If using "Matrix-based security":
     - Find user `astra`
     - Check **"Create"** permission
   - Or switch to "Logged-in users can do anything"
3. Save
4. Then run: `./scripts/setup-jenkins-jobs.sh "Fie@9eqmfp@cptsd"`

## Option 3: Use Admin User (If Available)

If there's an admin user with more permissions:

1. Get initial admin password:

   ```bash
   ssh root@37.27.39.20 "docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
   ```

2. Log in as admin at: https://jenkins.cptsd.in

3. Create jobs manually or grant permissions to `astra` user

## Verify Setup

After creating jobs:

```bash
# Check jobs exist
curl -s -k -u "astra:Fie@9eqmfp@cptsd" "https://jenkins.cptsd.in/api/json?tree=jobs[name]"

# Or use the script
./scripts/check-jenkins-builds.sh
```

## GitHub SSH Credentials

Make sure `github-ssh-key` credential exists in Jenkins:

1. Go to: https://jenkins.cptsd.in/credentials/store/system/domain/_/
2. Check if `github-ssh-key` exists
3. If not, add it:
   - Click "Add Credentials"
   - Kind: SSH Username with private key
   - ID: `github-ssh-key`
   - Username: `git`
   - Private Key: Enter the private key from `JENKINS_SSH_KEYS.md`

## After Setup

Once jobs are created:

- ✅ GitHub webhook will automatically trigger builds on push
- ✅ Manual builds can be triggered from Jenkins UI
- ✅ Check build status: https://jenkins.cptsd.in
