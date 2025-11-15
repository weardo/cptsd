/**
 * Stock image search and download utilities
 * Uses Unsplash API for free stock images
 */

export interface StockImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  description: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  width: number;
  height: number;
}

/**
 * Search for stock images using Unsplash API
 */
export async function searchStockImages(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<StockImage[]> {
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!unsplashAccessKey) {
    console.warn('UNSPLASH_ACCESS_KEY not set. Stock image search will not work.');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Client-ID ${unsplashAccessKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.thumb,
      downloadUrl: photo.links.download_location,
      description: photo.description || photo.alt_description || '',
      alt: photo.alt_description || photo.description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
    }));
  } catch (error) {
    console.error('Error searching stock images:', error);
    return [];
  }
}

/**
 * Download a stock image from Unsplash
 * Note: Unsplash requires tracking downloads via their API
 */
export async function downloadStockImage(imageId: string, downloadUrl: string): Promise<string> {
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!unsplashAccessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY not set');
  }

  try {
    // First, trigger the download tracking
    await fetch(`${downloadUrl}&client_id=${unsplashAccessKey}`, {
      method: 'GET',
    });

    // Get the actual download URL
    const photoResponse = await fetch(`https://api.unsplash.com/photos/${imageId}`, {
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
      },
    });

    if (!photoResponse.ok) {
      throw new Error(`Failed to get photo: ${photoResponse.statusText}`);
    }

    const photo = await photoResponse.json();
    return photo.urls.full || photo.urls.regular;
  } catch (error) {
    console.error('Error downloading stock image:', error);
    throw error;
  }
}

/**
 * Get suggested search queries based on blog content
 */
export async function getSuggestedImageQueries(content: string): Promise<string[]> {
  // Use OpenAI to suggest relevant image search queries
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  if (!process.env.OPENAI_API_KEY) {
    return ['nature', 'calm', 'peaceful', 'healing'];
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that suggests stock image search queries based on content. Return a JSON array of 3-5 search query strings that would find appropriate, calming, non-triggering images for CPTSD-related content.',
        },
        {
          role: 'user',
          content: `Based on this blog content, suggest 3-5 stock image search queries:\n\n${content.substring(0, 1000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.queries || result.query || ['nature', 'calm', 'peaceful'];
  } catch (error) {
    console.error('Error generating image queries:', error);
    return ['nature', 'calm', 'peaceful', 'healing'];
  }
}

