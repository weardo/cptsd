/**
 * Structured logging with request ID support
 * Redacts sensitive journal content from logs
 */

const REDACT_PATTERNS = [
  /journal.*entry/gi,
  /message.*content/gi,
  /rawText/gi,
];

function redactSensitive(text: string): string {
  let redacted = text;
  for (const pattern of REDACT_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  return redacted;
}

export function createLogger(requestId?: string) {
  const prefix = requestId ? `[${requestId}]` : '';

  return {
    info: (message: string, meta?: Record<string, any>) => {
      if (meta) {
        const safeMetaStr = redactSensitive(JSON.stringify(meta));
        try {
          const safeMeta = JSON.parse(safeMetaStr);
          console.log(`${prefix} [INFO] ${message}`, safeMeta);
        } catch {
          console.log(`${prefix} [INFO] ${message}`, safeMetaStr);
        }
      } else {
        console.log(`${prefix} [INFO] ${message}`);
      }
    },
    error: (message: string, error?: Error, meta?: Record<string, any>) => {
      if (meta) {
        const safeMetaStr = redactSensitive(JSON.stringify(meta));
        try {
          const safeMeta = JSON.parse(safeMetaStr);
          console.error(`${prefix} [ERROR] ${message}`, error?.message || '', safeMeta);
        } catch {
          console.error(`${prefix} [ERROR] ${message}`, error?.message || '', safeMetaStr);
        }
      } else {
        console.error(`${prefix} [ERROR] ${message}`, error?.message || '');
      }
    },
    warn: (message: string, meta?: Record<string, any>) => {
      if (meta) {
        const safeMetaStr = redactSensitive(JSON.stringify(meta));
        try {
          const safeMeta = JSON.parse(safeMetaStr);
          console.warn(`${prefix} [WARN] ${message}`, safeMeta);
        } catch {
          console.warn(`${prefix} [WARN] ${message}`, safeMetaStr);
        }
      } else {
        console.warn(`${prefix} [WARN] ${message}`);
      }
    },
  };
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

