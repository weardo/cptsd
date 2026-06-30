import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

// Note: unique: true already creates an index on key

// Safely get or create the model
const Settings: Model<ISettings> =
  (mongoose.models && mongoose.models.Settings) || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;

