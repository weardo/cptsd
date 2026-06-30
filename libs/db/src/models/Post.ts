import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PostType {
  CAROUSEL = 'CAROUSEL',
  REEL = 'REEL',
  STORY = 'STORY',
  MEME = 'MEME',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  APPROVED = 'APPROVED',
  POSTED = 'POSTED',
}

export interface IPostSlidePrompt {
  slideNumber: number;
  imageDescription: string;
}

export interface IPost extends Document {
  topicId: mongoose.Types.ObjectId;
  postType: PostType;
  status: PostStatus;
  rawIdea: string;
  script?: string;
  caption?: string;
  hashtags?: string;
  finchScreenshotUrl?: string;
  aiBackgroundUrls?: string[];
  zipUrl?: string;
  platforms?: string[];
  manualSlidePrompts?: IPostSlidePrompt[];
  authorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    postType: {
      type: String,
      enum: Object.values(PostType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.DRAFT,
    },
    rawIdea: { type: String, required: true },
    script: { type: String },
    caption: { type: String },
    hashtags: { type: String },
    finchScreenshotUrl: { type: String },
    aiBackgroundUrls: [{ type: String }],
    zipUrl: { type: String },
    platforms: [{ type: String }],
    manualSlidePrompts: [
      {
        slideNumber: { type: Number, required: true },
        imageDescription: { type: String, required: true },
      },
    ],
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
PostSchema.index({ topicId: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ postType: 1 });
PostSchema.index({ createdAt: -1 });

// Safely get or create the model
const Post: Model<IPost> =
  (mongoose.models && mongoose.models.Post) || mongoose.model<IPost>('Post', PostSchema);

export default Post;

