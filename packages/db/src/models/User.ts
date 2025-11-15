import mongoose, { Schema, Document, Model } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  MOD = 'MOD',
}

export interface IUser extends Document {
  name: string;
  email: string;
  role?: UserRole; // Optional for backward compatibility, defaults to MOD
  emailVerified?: Date;
  password?: string; // hashed password
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MOD,
    },
    emailVerified: { type: Date },
    password: { type: String },
    image: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Safely get or create the model
const User: Model<IUser> =
  (mongoose.models && mongoose.models.User) || mongoose.model<IUser>('User', UserSchema);

export default User;

