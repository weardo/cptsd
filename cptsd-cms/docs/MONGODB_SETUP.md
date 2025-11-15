# MongoDB Setup Guide

## Get Free MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (M0 Free Tier)
3. Create a new cluster (choose a cloud provider and region)
4. Wait for the cluster to be created (takes a few minutes)

## Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Set user privileges to "Atlas Admin" or "Read and write to any database"
6. Click "Add User"

## Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "5.5 or later"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `cptsd-cms` (or your preferred database name)

## Update .env.local

Add your MongoDB connection string to `.env.local`:

```env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/cptsd-cms?retryWrites=true&w=majority"
```

## Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address for production
4. Click "Confirm"

## Test Connection

After setting up, restart your dev server:

```bash
npm run dev
```

The application will automatically create the necessary collections on first use.

## Viewing Data

You can view your data using:

- MongoDB Atlas web interface (Browse Collections)
- [MongoDB Compass](https://www.mongodb.com/products/compass) (desktop app)
- VS Code extension: MongoDB for VS Code
