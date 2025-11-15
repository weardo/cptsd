# Jenkins GitHub SSH Keys

## 🔑 Generated SSH Key Pair

### Private Key (for Jenkins)

Copy this entire key including the BEGIN and END lines:

```
-----BEGIN OPENSSH PRIVATE KEY-----
[See output below]
-----END OPENSSH PRIVATE KEY-----
```

### Public Key (for GitHub)

Copy this entire key:

```
[See output below]
```

## 📋 Setup Instructions

### 1. Add Private Key to Jenkins

1. Go to: https://jenkins.cptsd.in/credentials/store/system/domain/_/newCredentials
2. Select: **SSH Username with private key**
3. Configure:
   - **ID**: `github-ssh-key`
   - **Description**: `GitHub SSH Key`
   - **Username**: `git`
   - **Private Key**: Select "Enter directly" and paste the **PRIVATE KEY** above
4. Click **OK**

### 2. Add Public Key to GitHub

1. Go to: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Configure:
   - **Title**: `Jenkins CI/CD`
   - **Key type**: `Authentication Key`
   - **Key**: Paste the **PUBLIC KEY** above
4. Click **"Add SSH key"**

### 3. Test Connection

After adding both keys, test the connection:

```bash
# From Jenkins server
ssh -T git@github.com
```

You should see: "Hi weardo! You've successfully authenticated..."

## 🔒 Security Notes

- Keep the private key secure - never commit it to git
- The private key is only for Jenkins
- The public key can be shared (it's meant to be public)
- These keys are stored in `/tmp/` - move them to a secure location if needed

## 🧪 Test Deployment

After setup, test with:

```bash
git commit --allow-empty -m "Test Jenkins deployment"
git push
```

This should trigger automatic builds in Jenkins.
