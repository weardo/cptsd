# Final Jenkins Setup - Manual Job Creation

Since API creation is having CSRF issues, manual creation is the fastest path.

## Quick Manual Setup (2 minutes)

### Step 1: Create cptsd-cms Job

1. **Go to**: https://jenkins.cptsd.in
2. Click **"New Item"** (top left)
3. Enter name: `cptsd-cms`
4. Select **"Pipeline"**
5. Click **OK**

**Configure:**
- **Description**: `CMS Application Pipeline`
- **Build Triggers**: ✅ Check **"GitHub hook trigger for GITScm polling"**
- **Pipeline**:
  - Definition: **Pipeline script from SCM**
  - SCM: **Git**
  - Repository URL: `git@github.com:weardo/cptsd.git`
  - Credentials: Select `github-ssh-key` from dropdown
  - Branch Specifier: `*/main`
  - Script Path: `cptsd-cms/Jenkinsfile`
- Click **Save**

### Step 2: Create cptsd-blog-public Job

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
  - Credentials: Select `github-ssh-key`
  - Branch Specifier: `*/main`
  - Script Path: `cptsd-blog-public/Jenkinsfile`
- Click **Save**

### Step 3: Verify

1. You should see both jobs on Jenkins homepage
2. Click on `cptsd-cms`
3. Click **"Build Now"** to test
4. Watch the build progress

### Step 4: Test Automatic Build

After jobs are created:

```bash
git commit --allow-empty -m "Test automatic deployment"
git push
```

The builds should start automatically via webhook!

## What's Already Configured ✅

- ✅ Jenkins running at https://jenkins.cptsd.in
- ✅ GitHub webhook configured and working
- ✅ GitHub SSH credentials (`github-ssh-key`)
- ✅ User permissions granted
- ✅ Domains configured (cms.cptsd.in, blog.cptsd.in, jenkins.cptsd.in)

## After Setup

Once jobs are created:
- ✅ Automatic builds on git push
- ✅ Manual builds from Jenkins UI
- ✅ Deployment to `/opt/cptsd-cms` and `/opt/cptsd-blog-public`

That's it! The webhook will handle everything automatically.

