/**
 * Safety layer for detecting crisis/self-harm content
 * Uses keyword heuristics (fast) + optional LLM classifier
 */

export enum SafetyLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Keywords that indicate potential self-harm or crisis
 * Includes English, Hindi, and Marathi basics
 */
const CRISIS_KEYWORDS = [
  // English
  'suicide',
  'kill myself',
  'end my life',
  'want to die',
  'not worth living',
  'better off dead',
  'self harm',
  'cut myself',
  'hurt myself',
  'overdose',
  'jump off',
  'hang myself',
  // Hindi (transliterated)
  'khudkushi',
  'apne aap ko maar',
  'mar jaana',
  'jeene ka fayda nahi',
  // Marathi (transliterated)
  'aatmahatya',
  'swatahla mar',
  'jaganyacha arth nahi',
];

/**
 * Medium-risk keywords (less severe but concerning)
 */
const MEDIUM_RISK_KEYWORDS = [
  'hopeless',
  'no point',
  'give up',
  'can\'t go on',
  'too much',
  'can\'t handle',
  'overwhelmed',
  'drowning',
  'trapped',
  'stuck',
  'no way out',
];

/**
 * Check text for safety concerns using keyword heuristics
 * Returns safety level and matched signals
 */
export function checkSafetyKeywords(text: string): {
  level: SafetyLevel;
  signals: string[];
} {
  const lowerText = text.toLowerCase();
  const matchedSignals: string[] = [];

  // Check for high-risk keywords
  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matchedSignals.push(keyword);
      return {
        level: SafetyLevel.HIGH,
        signals: matchedSignals,
      };
    }
  }

  // Check for medium-risk keywords
  for (const keyword of MEDIUM_RISK_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matchedSignals.push(keyword);
    }
  }

  if (matchedSignals.length > 0) {
    return {
      level: SafetyLevel.MEDIUM,
      signals: matchedSignals,
    };
  }

  return {
    level: SafetyLevel.NONE,
    signals: [],
  };
}

/**
 * Optional: Use LLM for more nuanced safety classification
 * Only called if keyword heuristics trigger ambiguity
 */
export async function classifySafetyWithLLM(
  text: string,
  openaiClient: any
): Promise<SafetyLevel> {
  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model for classification
      messages: [
        {
          role: 'system',
          content: `You are a safety classifier. Analyze the text for self-harm or crisis indicators. Respond with ONLY one word: "none", "low", "medium", or "high".`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const classification = response.choices[0]?.message?.content?.trim().toLowerCase();
    if (['none', 'low', 'medium', 'high'].includes(classification || '')) {
      return classification as SafetyLevel;
    }
  } catch (error) {
    console.error('[Safety] LLM classification failed:', error);
  }

  // Fallback to medium if LLM fails
  return SafetyLevel.MEDIUM;
}



