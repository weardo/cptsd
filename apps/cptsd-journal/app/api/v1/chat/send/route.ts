import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@cptsd/db/mongodb';
import {
  JournalConversation,
  JournalMessage,
  MessageRole,
  JournalEntry,
  EntrySource,
  Job,
  JobType,
  JobStatus,
  SafetyEvent,
  SafetyLevel,
  SafetyAction,
} from '@cptsd/db';
import { createAIAdapter, checkSafetyKeywords, CRISIS_RESPONSE_TEMPLATE } from '@cptsd/ai';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger, generateRequestId } from '@/lib/logger';
import { z } from 'zod';

const sendMessageSchema = z.object({
  conversationId: z.string().optional().nullable(),
  message: z.string().min(1).max(10000),
  mode: z.enum(['checkin', 'freewrite']),
});

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const logger = createLogger(requestId);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    await connectDB();

    // Get or create conversation
    let conversation;
    if (validated.conversationId) {
      conversation = await JournalConversation.findOne({
        _id: validated.conversationId,
        userId: userId as any,
      });
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      conversation = await JournalConversation.create({
        userId: userId as any,
        title: validated.mode === 'checkin' ? 'Daily Check-in' : 'Free Write',
      });
    }

    // Safety check
    const safetyCheck = checkSafetyKeywords(validated.message);
    let safetyFlag: 'none' | 'low' | 'medium' | 'high' = 'none';
    let safeResponse: string | null = null;
    let actionTaken: SafetyAction | null = null;

    if (safetyCheck.level === 'high') {
      safetyFlag = 'high';
      safeResponse = CRISIS_RESPONSE_TEMPLATE;
      actionTaken = SafetyAction.RESOURCES_SHOWN;

      // Record safety event
      await SafetyEvent.create({
        userId: userId as any,
        level: SafetyLevel.HIGH,
        signals: safetyCheck.signals,
        actionTaken,
      });

      logger.warn('High-risk content detected', {
        userId,
        conversationId: (conversation._id as any).toString(),
        signals: safetyCheck.signals,
      });
    } else if (safetyCheck.level === 'medium') {
      safetyFlag = 'medium';
      actionTaken = SafetyAction.WARNED;

      await SafetyEvent.create({
        userId: userId as any,
        level: SafetyLevel.MEDIUM,
        signals: safetyCheck.signals,
        actionTaken,
      });

      logger.warn('Medium-risk content detected', {
        userId,
        conversationId: (conversation._id as any).toString(),
        signals: safetyCheck.signals,
      });
    }

    // Store user message
    const userMessage = await JournalMessage.create({
      conversationId: conversation._id as any,
      userId: userId as any,
      role: MessageRole.USER,
      content: validated.message,
      metadata: {
        safetyFlag,
      },
    });

    // Generate assistant response
    const aiAdapter = createAIAdapter();
    let assistantResponse: string;
    let aiMetadata: any = {};

    if (safeResponse) {
      // Use safe response for high-risk content
      assistantResponse = safeResponse;
    } else {
      // Get conversation history for context
      const history = await JournalMessage.find({
        conversationId: conversation._id,
      })
        .sort({ createdAt: 1 })
        .limit(20)
        .lean();

      const messages = history.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      const chatResponse = await aiAdapter.generateChatReply(messages);
      assistantResponse = chatResponse.content;
      aiMetadata = {
        tokensIn: chatResponse.tokensIn,
        tokensOut: chatResponse.tokensOut,
        model: chatResponse.model,
        latencyMs: chatResponse.latencyMs,
      };
    }

    // Store assistant message
    const assistantMessage = await JournalMessage.create({
      conversationId: conversation._id,
      userId,
      role: MessageRole.ASSISTANT,
      content: assistantResponse,
      metadata: aiMetadata,
    });

    // Update conversation
    await JournalConversation.findByIdAndUpdate(conversation._id as any, {
      lastMessageAt: new Date(),
    });

    // Create journal entry
    // For freewrite: per message
    // For checkin: when message contains "Daily Check-in:" prefix (completed check-in)
    let entryId: string | undefined;
    const isCheckInComplete = validated.mode === 'checkin' && validated.message.includes('Daily Check-in:');
    
    if (validated.mode === 'freewrite' || isCheckInComplete) {
      const entry = await JournalEntry.create({
        userId: userId as any,
        conversationId: conversation._id as any,
        source: isCheckInComplete ? EntrySource.CHECKIN : EntrySource.FREEWRITE,
        rawText: validated.message,
        derivedFromMessageIds: [userMessage._id as any],
      });
      entryId = (entry._id as any).toString();

      // Enqueue analysis job
      await Job.create({
        type: JobType.ENTRY_ANALYSIS,
        status: JobStatus.PENDING,
        userId: userId as any,
        payload: { entryId: (entry._id as any).toString() },
        runAt: new Date(),
      });

      logger.info('Entry created and analysis job enqueued', {
        entryId: (entry._id as any).toString(),
        source: isCheckInComplete ? EntrySource.CHECKIN : EntrySource.FREEWRITE,
      });
    }

    return NextResponse.json({
      conversationId: (conversation._id as any).toString(),
      assistantMessage: assistantResponse,
      safety: {
        flagged: safetyFlag !== 'none',
        level: safetyFlag !== 'none' ? safetyFlag : undefined,
      },
      entryId,
      requestId,
    });
  } catch (error: any) {
    logger.error('Error in chat send', error, {});
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

