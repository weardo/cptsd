# CPTSD CMS - Content Management System

A content management system for CPTSD awareness project built with Next.js 16, MongoDB, and OpenAI.

## Quick Start

1. **Setup MongoDB** - See `docs/MONGODB_SETUP.md`
2. **Configure Environment** - Copy `.env.local.example` to `.env.local`
3. **Install Dependencies** - `npm install`
4. **Run Development Server** - `npm run dev`
5. **Access** - http://localhost:3000

## Documentation

All documentation is in the `docs/` folder:

- `MONGODB_SETUP.md` - MongoDB Atlas setup guide
- `SIMPLIFIED_SETUP.md` - Complete setup guide
- `NO_N8N_NEEDED.md` - Why n8n isn't needed
- `SETUP_STATUS.md` - Setup status and checklist

## Features

- ✅ Topic & Post management
- ✅ Direct OpenAI AI content generation (no n8n needed!)
- ✅ File uploads (MinIO/S3)
- ✅ Search and filtering
- ✅ Authentication

## Tech Stack

- Next.js 16, TypeScript, MongoDB, Mongoose, NextAuth v4, OpenAI, Tailwind CSS
