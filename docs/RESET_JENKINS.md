# Reset Jenkins Setup

## Why Reset?

If the `astra` user doesn't have proper permissions to create jobs, resetting Jenkins will:
- Clear all existing configuration
- Allow you to set up a fresh admin user
- Give you full control from the start

## Option 1: Reset Jenkins (Recommended for Fresh Start)

### Step 1: Run Reset Script

```bash
./scripts/reset-jenkins.sh
```

This will:
- Stop Jenkins
- Backup current config (just in case)
- Remove users and jobs
- Reset security configuration
- Restart Jenkins

### Step 2: Initial Setup

1. Go to: https://jenkins.cptsd.in
2. You'll see the setup wizard
3. **Get initial admin password**:
   ```bash
   ssh root@37.27.39.20 "docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
   ```
4. Enter the password
5. **Install suggested plugins** (or skip)
6. **Create admin user**:
   - Username: `astra` (or your choice)
   - Password: `Fie@9eqmfp@cptsd` (or your choice)
   - Full name: Your name
   - Email: Your email
7. Complete setup

### Step 3: Setup Jobs

After initial setup, run:

```bash
# Setup GitHub SSH credentials
./scripts/setup-jenkins-credentials.sh

# Create jobs
./scripts/setup-jenkins-jobs.sh "Fie@9eqmfp@cptsd"
```

## Option 2: Manual Permission Grant (If You Have Admin Access)

If you have access to an admin account:

1. Go to: https://jenkins.cptsd.in/configureSecurity/
2. Under **"Authorization"**:
   - Select **"Logged-in users can do anything"** (easiest)
   - OR use **"Matrix-based security"** and grant all permissions to `astra`
3. Save
4. Then run: `./scripts/setup-jenkins-jobs.sh "Fie@9eqmfp@cptsd"`

## After Reset/Setup

Once Jenkins is configured:

1. **Add GitHub SSH Credential**:
   - Go to: https://jenkins.cptsd.in/credentials/store/system/domain/_/newCredentials
   - Kind: SSH Username with private key
   - ID: `github-ssh-key`
   - Username: `git`
   - Private Key: From `JENKINS_SSH_KEYS.md`

2. **Create Jobs** (automatically or manually):
   ```bash
   ./scripts/setup-jenkins-jobs.sh "Fie@9eqmfp@cptsd"
   ```

3. **Verify**:
   ```bash
   ./scripts/check-jenkins-builds.sh
   ```

## Recommendation

Since this is a fresh setup and you're having permission issues, **resetting Jenkins is the cleanest approach**. It will:
- ✅ Give you full control
- ✅ Allow proper initial setup
- ✅ Enable API access for automation
- ✅ Take only a few minutes

The webhook is already configured in GitHub, so once jobs are created, everything will work automatically.

