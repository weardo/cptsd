import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Story, StoryStatus } from '@cptsd/db';
import mongoose from 'mongoose';

// Simple rate limiting - store in memory (in production, use Redis or similar)
const submissions = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_WINDOW = 3;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userSubmissions = submissions.get(ip) || [];
  const recentSubmissions = userSubmissions.filter((time) => now - time < RATE_LIMIT_WINDOW);
  
  if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false;
  }
  
  recentSubmissions.push(now);
  submissions.set(ip, recentSubmissions);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { pseudonym, title, body: storyBody } = body;

    // Validation
    if (!pseudonym || typeof pseudonym !== 'string' || pseudonym.trim().length === 0) {
      return NextResponse.json(
        { error: 'Pseudonym is required' },
        { status: 400 }
      );
    }

    if (!storyBody || typeof storyBody !== 'string' || storyBody.trim().length < 50) {
      return NextResponse.json(
        { error: 'Story must be at least 50 characters long' },
        { status: 400 }
      );
    }

    if (storyBody.length > 10000) {
      return NextResponse.json(
        { error: 'Story must be less than 10,000 characters' },
        { status: 400 }
      );
    }

    // Basic spam protection - check for suspicious patterns
    const suspiciousPatterns = [
      /http[s]?:\/\//gi, // URLs
      /@\w+/g, // Email-like patterns
      /(.)\1{10,}/g, // Repeated characters
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(storyBody)) {
        // Allow some URLs but flag excessive ones
        const urlMatches = storyBody.match(/http[s]?:\/\//gi);
        if (urlMatches && urlMatches.length > 2) {
          return NextResponse.json(
            { error: 'Story contains too many links' },
            { status: 400 }
          );
        }
      }
    }

    // Connect to database and create story
    await connectDB();

    const story = new Story({
      pseudonym: pseudonym.trim(),
      title: title?.trim() || undefined,
      body: storyBody.trim(),
      status: StoryStatus.PENDING,
    });

    const savedStory = await story.save();

    return NextResponse.json(
      { message: 'Story submitted successfully', id: (savedStory._id as mongoose.Types.ObjectId).toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting story:', error);
    return NextResponse.json(
      { error: 'Failed to submit story. Please try again.' },
      { status: 500 }
    );
  }
}

