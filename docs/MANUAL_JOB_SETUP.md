# Manual Jenkins Job Setup

Since the API approach is having permission issues, here's how to create the jobs manually:

## Create cptsd-cms Job

1. Go to: https://jenkins.cptsd.in
2. Click **"New Item"** (or "Create a job")
3. Enter name: `cptsd-cms`
4. Select **"Pipeline"**
5. Click **OK**

### Configure Pipeline:

1. **General**:
   - Description: `CMS Application Pipeline`

2. **Build Triggers**:
   - ✅ Check **"GitHub hook trigger for GITScm polling"**

3. **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `git@github.com:weardo/cptsd.git`
   - Credentials: Select `github-ssh-key` (or add it if not present)
   - Branch Specifier: `*/main`
   - Script Path: `cptsd-cms/Jenkinsfile`

4. Click **Save**

## Create cptsd-blog-public Job

1. Click **"New Item"**
2. Enter name: `cptsd-blog-public`
3. Select **"Pipeline"**
4. Click **OK**

### Configure Pipeline:

1. **General**:
   - Description: `Blog Public Application Pipeline`

2. **Build Triggers**:
   - ✅ Check **"GitHub hook trigger for GITScm polling"**

3. **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `git@github.com:weardo/cptsd.git`
   - Credentials: Select `github-ssh-key`
   - Branch Specifier: `*/main`
   - Script Path: `cptsd-blog-public/Jenkinsfile`

4. Click **Save**

## Verify Setup

After creating both jobs:
1. Go to Jenkins home: https://jenkins.cptsd.in
2. You should see both jobs listed
3. Click on a job and click **"Build Now"** to test
4. Check the build console output

## GitHub Webhook

The webhook should already be configured at:
- URL: `https://jenkins.cptsd.in/github-webhook/`
- Events: Push events

After the jobs are created, pushes to GitHub should trigger automatic builds.

