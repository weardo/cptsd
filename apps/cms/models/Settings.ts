import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  key: string; // Unique key for the setting (e.g., 'defaultModel', 'systemPrompt')
  value: string; // Value of the setting
  description?: string; // Optional description
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

// Note: unique: true already creates an index, so we don't need to add another one

const Settings: Model<ISettings> =
  (mongoose.models && mongoose.models.Settings) || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;

