/**
 * YouTube video transcription and processing utilities
 */

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get YouTube video URL from video ID
 */
export function getYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Check if yt-dlp is available on the system
 */
async function isYtDlpAvailable(): Promise<boolean> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync('which yt-dlp', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Transcribe YouTube video using youtube-transcript package (primary) or yt-dlp (fallback)
 */
export async function transcribeYouTubeVideo(
  videoUrl: string
): Promise<{ transcription: string; rawTranscription: string; videoId: string }> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Try youtube-transcript package first (already installed, no external dependencies)
  try {
    return await transcribeWithYouTubeTranscriptAPI(videoId);
  } catch (error) {
    console.warn('youtube-transcript package failed, trying yt-dlp fallback:', error);
    
    // Fallback to yt-dlp if available
    const ytDlpAvailable = await isYtDlpAvailable();
    if (!ytDlpAvailable) {
      throw new Error(
        `Failed to transcribe video. The video may not have captions available, or yt-dlp is not installed. ` +
        `To install yt-dlp, run: pip install yt-dlp (or use your system package manager)`
      );
    }

    try {
      return await transcribeWithYtDlp(videoUrl, videoId);
    } catch (ytDlpError) {
      throw new Error(
        `Failed to transcribe video: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `The video may not have subtitles available.`
      );
    }
  }
}

/**
 * Transcribe using yt-dlp
 */
async function transcribeWithYtDlp(
  videoUrl: string,
  videoId: string
): Promise<{ transcription: string; rawTranscription: string; videoId: string }> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  // Use yt-dlp to get subtitles
  // First, try to get auto-generated subtitles
  const command = `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt "${videoUrl}" -o - 2>/dev/null || yt-dlp --write-sub --sub-lang en --skip-download --sub-format vtt "${videoUrl}" -o - 2>/dev/null || echo ""`;

  const { stdout, stderr } = await execAsync(command, {
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    timeout: 300000, // 5 minute timeout
  });

  if (stderr && !stdout) {
    console.warn('yt-dlp stderr:', stderr);
    throw new Error('Failed to extract subtitles from YouTube video');
  }

  // Parse VTT format to extract text
  const rawTranscription = stdout || '';
  const transcription = parseVTT(rawTranscription);

  if (!transcription) {
    throw new Error('No transcription found. The video may not have subtitles available.');
  }

  return {
    transcription,
    rawTranscription,
    videoId,
  };
}

/**
 * Parse VTT (WebVTT) subtitle format to plain text
 */
function parseVTT(vttContent: string): string {
  if (!vttContent) return '';

  // Remove VTT header and metadata
  let text = vttContent
    .replace(/WEBVTT[\s\S]*?\n\n/, '') // Remove header
    .replace(/^\d+\n/gm, '') // Remove cue numbers
    .replace(/^\d{2}:\d{2}:\d{2}[\d:.,]+\s*-->\s*\d{2}:\d{2}:\d{2}[\d:.,]+\n/gm, '') // Remove timestamps
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .trim();

  // Clean up common VTT artifacts
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  return text;
}

/**
 * Fallback: Use youtube-transcript package if available
 */
async function transcribeWithYouTubeTranscriptAPI(videoId: string): Promise<{
  transcription: string;
  rawTranscription: string;
  videoId: string;
}> {
  try {
    // Dynamic import to avoid errors if package is not installed
    const { YoutubeTranscript } = await import('youtube-transcript');
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const transcription = transcript
      .map((item) => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      transcription,
      rawTranscription: JSON.stringify(transcript),
      videoId,
    };
  } catch (error) {
    throw new Error(
      `YouTube Transcript API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get video metadata using YouTube oEmbed API (primary) or yt-dlp (fallback)
 */
export async function getYouTubeVideoMetadata(videoUrl: string): Promise<{
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
}> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Try oEmbed API first (no external dependencies)
  try {
    return await getMetadataWithOEmbed(videoId);
  } catch (error) {
    console.warn('oEmbed API failed, trying yt-dlp fallback:', error);
    
    // Fallback to yt-dlp if available
    const ytDlpAvailable = await isYtDlpAvailable();
    if (!ytDlpAvailable) {
      // Return minimal metadata if yt-dlp is not available
      return {
        title: '',
        description: '',
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      };
    }

    try {
      return await getMetadataWithYtDlp(videoUrl);
    } catch (ytDlpError) {
      console.error('Error fetching YouTube metadata with yt-dlp:', ytDlpError);
      // Return minimal metadata as last resort
      return {
        title: '',
        description: '',
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      };
    }
  }
}

/**
 * Get metadata using YouTube oEmbed API
 */
async function getMetadataWithOEmbed(videoId: string): Promise<{
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
}> {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  const response = await fetch(oEmbedUrl);
  if (!response.ok) {
    throw new Error(`oEmbed API returned ${response.status}`);
  }

  const data = await response.json();

  return {
    title: data.title || '',
    description: '', // oEmbed doesn't provide description
    duration: 0, // oEmbed doesn't provide duration
    thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

/**
 * Get metadata using yt-dlp
 */
async function getMetadataWithYtDlp(videoUrl: string): Promise<{
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
}> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const command = `yt-dlp --dump-json --no-warnings "${videoUrl}"`;
  const { stdout } = await execAsync(command, {
    maxBuffer: 10 * 1024 * 1024,
    timeout: 60000,
  });

  const metadata = JSON.parse(stdout);

  return {
    title: metadata.title || '',
    description: metadata.description || '',
    duration: metadata.duration || 0,
    thumbnail: metadata.thumbnail || metadata.thumbnails?.[0]?.url || '',
  };
}

