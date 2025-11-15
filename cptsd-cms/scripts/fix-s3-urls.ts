/**
 * Script to fix existing S3 URLs in MongoDB
 * Converts internal Docker URLs (http://minio:9000/...) to public URLs (http://37.27.39.20:9000/...)
 * 
 * Usage: npx tsx scripts/fix-s3-urls.ts
 */

import mongoose from 'mongoose';
import GeneratedAsset from '../models/GeneratedAsset';
import { getDatabaseConfig } from '../lib/config';

const OLD_URL_PATTERN = /^http:\/\/minio:9000\//;
const NEW_PUBLIC_URL = process.env.S3_PUBLIC_URL || 'http://37.27.39.20:9000';

async function fixS3Urls() {
  try {
    const dbConfig = getDatabaseConfig();
    await mongoose.connect(dbConfig.uri);
    console.log('✅ Connected to MongoDB');

    // Find all assets with internal MinIO URLs
    const assets = await GeneratedAsset.find({
      $or: [
        { url: { $regex: OLD_URL_PATTERN } },
        { thumbnailUrl: { $regex: OLD_URL_PATTERN } },
      ],
    });

    console.log(`📦 Found ${assets.length} assets with internal URLs to fix`);

    let fixedCount = 0;
    for (const asset of assets) {
      let updated = false;
      const updates: any = {};

      if (asset.url && OLD_URL_PATTERN.test(asset.url)) {
        updates.url = asset.url.replace(OLD_URL_PATTERN, `${NEW_PUBLIC_URL}/`);
        updated = true;
      }

      if (asset.thumbnailUrl && OLD_URL_PATTERN.test(asset.thumbnailUrl)) {
        updates.thumbnailUrl = asset.thumbnailUrl.replace(OLD_URL_PATTERN, `${NEW_PUBLIC_URL}/`);
        updated = true;
      }

      if (updated) {
        await GeneratedAsset.updateOne({ _id: asset._id }, { $set: updates });
        fixedCount++;
        console.log(`✅ Fixed asset ${asset._id}: ${updates.url || asset.url}`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} assets`);
    console.log(`📝 Updated URLs from http://minio:9000/ to ${NEW_PUBLIC_URL}/`);
  } catch (error) {
    console.error('❌ Error fixing S3 URLs:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixS3Urls();

