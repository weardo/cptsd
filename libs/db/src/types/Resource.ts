// Types-only exports for Resource (no Mongoose dependencies)
// Safe to import in client components

export enum ResourceType {
  BOOK = 'BOOK',
  VIDEO = 'VIDEO',
  COMMUNITY = 'COMMUNITY',
  EMERGENCY = 'EMERGENCY',
  WEBSITE = 'WEBSITE',
  PODCAST = 'PODCAST',
  ARTICLE = 'ARTICLE',
  TOOL = 'TOOL',
  OTHER = 'OTHER',
  // Support page types
  HELPLINE = 'HELPLINE',
  THERAPY_DIRECTORY = 'THERAPY_DIRECTORY',
  NGO = 'NGO',
  EDUCATIONAL_SITE = 'EDUCATIONAL_SITE',
}

export enum ResourceCategory {
  EDUCATION = 'EDUCATION',
  SUPPORT = 'SUPPORT',
  THERAPY = 'THERAPY',
  SELF_CARE = 'SELF_CARE',
  EMERGENCY = 'EMERGENCY',
  COMMUNITY = 'COMMUNITY',
  RESEARCH = 'RESEARCH',
  OTHER = 'OTHER',
}

