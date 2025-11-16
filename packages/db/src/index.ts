// Shared database package for CPTSD monorepo
// All three apps (cptsd-cms, cptsd-blog-public, cptsd-main) import from here

// MongoDB connection
export { default as connectDB } from './mongodb';

// Core models (used by all apps)
export { default as Article, ArticleStatus, ArticleCategory } from './models/Article';
export type { IArticle, IArticleImage } from './models/Article';

export { default as Resource, ResourceType, ResourceCategory } from './models/Resource';
export type { IResource } from './models/Resource';

export { default as FeaturedContent } from './models/FeaturedContent';
export type { IFeaturedContent } from './models/FeaturedContent';
export { fetchPublishedFeaturedContent, incrementFeaturedContentClick } from './featuredContent';

export { default as Story, StoryStatus } from './models/Story';
export type { IStory } from './models/Story';

export { default as User, UserRole } from './models/User';
export type { IUser } from './models/User';

// CMS-specific models (used primarily by cptsd-cms, but available to all)
export { default as Post, PostType, PostStatus } from './models/Post';
export type { IPost, IPostSlidePrompt } from './models/Post';

export { default as Topic } from './models/Topic';
export type { ITopic } from './models/Topic';

export { default as GeneratedAsset, AssetKind } from './models/GeneratedAsset';
export type { IGeneratedAsset, CompositionType } from './models/GeneratedAsset';

export { default as ContentIdea, IdeaStatus } from './models/ContentIdea';
export type { IContentIdea, IContentIdeaItem } from './models/ContentIdea';

export { default as PromptTemplate } from './models/PromptTemplate';
export type { IPromptTemplate } from './models/PromptTemplate';

export { default as Settings } from './models/Settings';
export type { ISettings } from './models/Settings';

export { default as StandaloneGeneration } from './models/StandaloneGeneration';
export type { IStandaloneGeneration } from './models/StandaloneGeneration';

export { default as SupportiveMessage, PetType as SupportiveMessagePetType } from './models/SupportiveMessage';
export type { ISupportiveMessage } from './models/SupportiveMessage';

// Backward compatibility: export Article as Blog for migration period
export { default as Blog } from './models/Article';
export { ArticleStatus as BlogStatus } from './models/Article';
export type { IArticle as IBlog, IArticleImage as IBlogImage } from './models/Article';

