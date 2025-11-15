# CPTSD CMS - Content Management System

A content management system for CPTSD awareness project built with Next.js 16, MongoDB, and OpenAI.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **MongoDB** - NoSQL database (MongoDB Atlas free tier)
- **Mongoose** - MongoDB ODM
- **NextAuth v4** - Authentication
- **Tailwind CSS** - Styling
- **AWS S3 SDK** - File uploads (MinIO compatible)
- **OpenAI** - Direct AI content generation
- **Zod** - Environment variable validation

## Quick Start

### 1. Setup MongoDB

1. Sign up for free MongoDB Atlas account: https://www.mongodb.com/cloud/atlas/register
2. Create a cluster (M0 Free Tier)
3. Create a database user
4. Get your connection string
5. Add to `.env.local`:

```env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/cptsd-cms?retryWrites=true&w=majority"
```

See `docs/MONGODB_SETUP.md` for detailed instructions.

### 2. Setup Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `MONGODB_URI` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key (for AI content generation)
- `S3_ACCESS_KEY_ID` - S3/MinIO access key
- `S3_SECRET_ACCESS_KEY` - S3/MinIO secret key
- `S3_BUCKET_NAME` - S3 bucket name
- `ADMIN_EMAIL` - Admin email
- `ADMIN_PASSWORD` - Admin password (min 8 chars)
- `NEXTAUTH_SECRET` - Random secret (min 32 chars)
- `NEXTAUTH_URL` - Application URL (default: http://localhost:3000)

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The application will automatically:
- Connect to MongoDB
- Create collections on first use
- Initialize admin user on first run

### 5. Access the Application

- Open http://localhost:3000
- Login with your admin credentials
- Create topics and posts
- Use "Generate with AI" button for AI content generation

## Features

- ✅ Topic management (create, edit, delete)
- ✅ Post management (create, edit, delete)
- ✅ File uploads (Finch screenshots via MinIO/S3)
- ✅ **AI content generation** (direct OpenAI integration - no n8n needed!)
- ✅ Search and filtering
- ✅ Authentication with NextAuth

## Database

MongoDB is used as the database. Collections are automatically created on first use:
- `users` - User accounts
- `topics` - Content topics
- `posts` - Content posts

## AI Content Generation

The app uses **direct OpenAI integration** - no n8n needed! When you click "Generate with AI":
- Script generation (GPT-4)
- Caption generation (GPT-4)
- Hashtags generation (GPT-3.5-turbo)

All done directly from Next.js server actions.

## File Storage

MinIO (S3-compatible) is used for file storage. For local development:
- MinIO Console: http://localhost:9001
- Default credentials: minioadmin / minioadmin

Start MinIO:
```bash
docker-compose up -d minio
```

## Project Structure

```
cptsd-cms/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── actions/           # Server Actions
│   └── pages/             # Pages
├── components/            # React components
├── docs/                  # Documentation
├── lib/                   # Utilities
│   ├── mongodb.ts        # MongoDB connection
│   ├── auth.ts           # NextAuth configuration
│   ├── config.ts         # Environment config
│   ├── openai.ts         # Direct OpenAI integration
│   ├── openai-direct.ts  # Content generation wrapper
│   ├── s3.ts             # S3 file uploads
│   └── n8n.ts            # n8n integration (deprecated)
├── models/                # Mongoose models
│   ├── User.ts
│   ├── Topic.ts
│   └── Post.ts
└── public/                # Static files
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests

## Documentation

All documentation is in the `docs/` folder:
- `MONGODB_SETUP.md` - MongoDB Atlas setup guide
- `SIMPLIFIED_SETUP.md` - Simplified setup guide (no n8n)
- `NO_N8N_NEEDED.md` - Why n8n isn't needed
- `SETUP_STATUS.md` - Setup status and checklist

## License

MIT
