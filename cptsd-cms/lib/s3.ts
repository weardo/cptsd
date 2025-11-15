import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Config } from './config';
import { randomUUID } from 'crypto';

const s3Config = getS3Config();

export const s3Client = new S3Client({
  region: s3Config.region,
  credentials: s3Config.credentials,
  ...(s3Config.endpoint && { endpoint: s3Config.endpoint }),
  forcePathStyle: true, // Required for MinIO and some S3-compatible services
});

/**
 * Upload a file to S3
 * @param file - File buffer or stream
 * @param fileName - Original file name
 * @param folder - Optional folder prefix (e.g., 'finch-screenshots')
 * @returns Public URL of the uploaded file
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  folder?: string
): Promise<string> {
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${folder || 'uploads'}/${randomUUID()}.${fileExtension}`;
  
  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: uniqueFileName,
    Body: file,
    ContentType: getContentType(fileExtension || ''),
    ACL: 'public-read', // Make file publicly accessible
  });
  
  await s3Client.send(command);
  
  // Construct public URL
  if (s3Config.endpoint) {
    // For MinIO or custom endpoints
    const endpointUrl = new URL(s3Config.endpoint);
    return `${endpointUrl.protocol}//${endpointUrl.host}/${s3Config.bucket}/${uniqueFileName}`;
  } else {
    // For AWS S3
    return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${uniqueFileName}`;
  }
}

/**
 * Get a presigned URL for temporary access to a file
 * @param key - S3 object key
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 * @param url - Full URL of the file to delete
 * @returns Success status
 */
export async function deleteFromS3(url: string): Promise<boolean> {
  try {
    // Extract the key from the URL
    // For MinIO: http://localhost:9000/bucket/folder/file.png
    // For AWS S3: https://bucket.s3.region.amazonaws.com/folder/file.png
    let key = '';
    
    if (s3Config.endpoint) {
      // MinIO or custom endpoint
      const endpointUrl = new URL(s3Config.endpoint);
      const bucketPrefix = `${endpointUrl.protocol}//${endpointUrl.host}/${s3Config.bucket}/`;
      if (url.startsWith(bucketPrefix)) {
        key = url.substring(bucketPrefix.length);
      } else {
        // Try parsing as full URL
        const urlObj = new URL(url);
        key = urlObj.pathname.substring(1); // Remove leading /
        if (key.startsWith(s3Config.bucket + '/')) {
          key = key.substring(s3Config.bucket.length + 1);
        }
      }
    } else {
      // AWS S3
      const urlObj = new URL(url);
      key = urlObj.pathname.substring(1); // Remove leading /
      if (key.startsWith(s3Config.bucket + '/')) {
        key = key.substring(s3Config.bucket.length + 1);
      }
    }

    if (!key) {
      console.warn(`Could not extract S3 key from URL: ${url}`);
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`✅ Deleted S3 object: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting S3 object: ${url}`, error);
    return false;
  }
}

function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    zip: 'application/zip',
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

