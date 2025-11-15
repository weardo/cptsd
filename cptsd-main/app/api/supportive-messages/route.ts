import { NextResponse } from 'next/server';
import { getSupportiveMessagesForPet } from '@/lib/getSupportiveMessages';
import { PetType } from '@cptsd/pets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const petType = searchParams.get('petType') as PetType;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const excludeTags = searchParams.get('excludeTags')?.split(',').filter(Boolean);

    if (!petType) {
      return NextResponse.json({ error: 'petType is required' }, { status: 400 });
    }

    // Auto-detect seasonal tags based on current date
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const autoTags: string[] = [];

    // Add seasonal tags
    if (month >= 12 || month <= 2) autoTags.push('winter');
    if (month >= 3 && month <= 5) autoTags.push('spring');
    if (month >= 6 && month <= 8) autoTags.push('summer');
    if (month >= 9 && month <= 11) autoTags.push('fall');

    // Combine user-specified tags with auto-detected seasonal tags
    const allTags = tags ? [...tags, ...autoTags] : autoTags;

    const messages = await getSupportiveMessagesForPet(petType, {
      limit: 20,
      // Only include tags if user explicitly specified them (not just seasonal)
      // This allows all messages to be shown, with seasonal ones prioritized if they have tags
      includeTags: tags && tags.length > 0 ? allTags : undefined,
      excludeTags: excludeTags,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching supportive messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', messages: [] },
      { status: 500 }
    );
  }
}

