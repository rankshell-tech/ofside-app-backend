import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../config/aws';

export const generatePresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

export const generatePresignedDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

export const deleteFile = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

export const generateFileKey = (
  folder: string,
  userId: string,
  originalName: string
): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  
  return `${folder}/${userId}/${timestamp}-${randomString}.${extension}`;
};

export const getPublicUrl = (key: string): string => {
  return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
};