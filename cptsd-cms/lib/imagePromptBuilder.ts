/**
 * Central image prompt builder for controlled variations
 * Supports different composition types and formats for CPTSD-safe image generation
 */

export type CompositionType =
  | 'BACKGROUND_ONLY'
  | 'BIRD_ONLY'
  | 'BIRD_WITH_SPEECH_BUBBLE'
  | 'BIRD_ACTION_SCENE'
  | 'TEXT_FOCUSED';

export type TargetFormat = 'FEED_SQUARE' | 'STORY_VERTICAL';

export interface ImagePromptOptions {
  compositionType: CompositionType;
  targetFormat: TargetFormat;
  summary: string; // short summary of the post (derive from script/caption)
  tone?: 'validating' | 'educational' | 'gentle' | 'hopeful' | 'grounding';
  actionDescription?: string; // for BIRD_ACTION_SCENE, e.g., "doing a simple grounding exercise"
  extraStyleFlags?: string[]; // e.g., ["playful","warmer","nighttime"]
}

/**
 * Base style chunk for all CPTSD images
 * This ensures consistency across all generated images
 * Optimized to be concise for DALL-E's 1000 character limit
 * Uses neutral language to avoid safety filters
 */
const BASE_STYLE_CHUNK = `Soft minimal flat vector illustration, warm muted colors, gentle calming atmosphere. Cute round bird mascot, children's book style, friendly guide. No violence, dark themes, or realistic humans. Focus on metaphors, emotions, and wellness. Supportive content, Indian context, no stereotypes.`;

/**
 * Build a DALL-E prompt based on composition type and options
 */
export function buildImagePrompt(options: ImagePromptOptions): string {
  const { compositionType, targetFormat, summary, tone = 'gentle', actionDescription, extraStyleFlags = [] } = options;

  // Start with base style chunk
  let prompt = BASE_STYLE_CHUNK;

  // Add tone-specific guidance (concise)
  const toneGuidance = getToneGuidance(tone);
  if (toneGuidance) {
    prompt += ` ${toneGuidance}`;
  }

  // Truncate and sanitize summary to fit within limits and avoid safety filters
  // Remove potentially triggering words and keep it neutral
  let sanitizedSummary = summary
    .replace(/\b(CPTSD|PTSD|trauma|traumatic|abuse|neglect|violence|trigger|triggering)\b/gi, 'emotional healing')
    .replace(/\b(depression|anxiety|panic|stress)\b/gi, 'wellness')
    .substring(0, 150);
  
  const truncatedSummary = sanitizedSummary.length > 150 ? sanitizedSummary.substring(0, 147) + '...' : sanitizedSummary;

  // Add composition-specific instructions (concise)
  switch (compositionType) {
    case 'BACKGROUND_ONLY':
      prompt += ` Abstract scenic background, soft gradients, empty space for text overlay. No characters or text. Theme: "${truncatedSummary}".`;
      break;

    case 'BIRD_ONLY':
      prompt += ` Bird mascot as main subject, prominently featured. Simple calming background. No speech bubbles or text. Theme: "${truncatedSummary}".`;
      break;

    case 'BIRD_WITH_SPEECH_BUBBLE':
      prompt += ` Bird mascot with empty blank speech bubble next to head. Bubble must be empty, clear space inside. No text anywhere. Theme: "${truncatedSummary}".`;
      break;

    case 'BIRD_ACTION_SCENE':
      if (actionDescription) {
        const truncatedAction = actionDescription.length > 100 ? actionDescription.substring(0, 97) + '...' : actionDescription;
        prompt += ` Bird mascot ${truncatedAction}. Main focus, clearly visible. Symbolic elements, no text.`;
      } else {
        prompt += ` Bird mascot performing action related to: "${truncatedSummary}". Main focus, no text.`;
      }
      break;

    case 'TEXT_FOCUSED':
      prompt += ` Background with large clean area for text overlay (center or top). Subtle edge elements. Bird optional in background. No text. Theme: "${truncatedSummary}".`;
      break;
  }

  // Add format-specific layout hints (concise)
  if (targetFormat === 'FEED_SQUARE') {
    prompt += ` Square 1080x1080, balanced layout for Instagram feed.`;
  } else if (targetFormat === 'STORY_VERTICAL') {
    prompt += ` Vertical 1080x1920, visual interest top/bottom, clean center for text.`;
  }

  // Add extra style flags if provided (concise)
  if (extraStyleFlags.length > 0) {
    const styleDescriptions = extraStyleFlags.map((flag) => {
      switch (flag.toLowerCase()) {
        case 'lighter':
        case 'lighter colors':
          return 'lighter pastels';
        case 'darker':
        case 'darker but still soft':
          return 'darker soft muted';
        case 'playful':
        case 'more playful':
          return 'playful whimsical';
        case 'warmer':
          return 'warm tones';
        case 'cooler':
          return 'cool tones';
        case 'nighttime':
          return 'gentle nighttime';
        case 'daytime':
          return 'bright daytime';
        default:
          return flag;
      }
    });
    prompt += ` Style: ${styleDescriptions.join(', ')}.`;
  }

  // Always enforce no text (concise)
  prompt += ` No written text, logos, or watermarks.`;

  // Ensure prompt is under 1000 characters (DALL-E limit)
  if (prompt.length > 1000) {
    // If still too long, truncate the summary further
    const maxSummaryLength = 1000 - (prompt.length - truncatedSummary.length) - 10;
    const finalSummary = truncatedSummary.length > maxSummaryLength 
      ? truncatedSummary.substring(0, maxSummaryLength - 3) + '...' 
      : truncatedSummary;
    
    // Replace the summary in the prompt
    prompt = prompt.replace(new RegExp(`"${truncatedSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `"${finalSummary}"`);
    
    // Final safety check - if still too long, truncate the entire prompt
    if (prompt.length > 1000) {
      prompt = prompt.substring(0, 997) + '...';
    }
  }

  return prompt.trim();
}

/**
 * Get tone-specific guidance for the prompt (concise version)
 */
function getToneGuidance(tone: string): string {
  switch (tone) {
    case 'validating':
      return `Mood: gentle, validating, compassionate. Soft soothing colors, warm safe feeling.`;
    case 'educational':
      return `Mood: calm, educational, informative. Soft colors, gentle lighting.`;
    case 'hopeful':
      return `Mood: hopeful, uplifting. Bright soft colors, progress elements.`;
    case 'grounding':
      return `Mood: grounding, stabilizing. Earthy calming colors, safety presence.`;
    case 'gentle':
    default:
      return `Mood: gentle, supportive. Soft calming colors, safe atmosphere.`;
  }
}

