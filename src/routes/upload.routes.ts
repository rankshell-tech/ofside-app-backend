import { Router } from 'express';
import { Request, Response } from 'express';
import { generatePresignedUploadUrl, generateFileKey } from '../utils/s3';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest, authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/upload/presigned-url:
 *   post:
 *     summary: Get presigned URL for file upload
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *               folder:
 *                 type: string
 *                 enum: [profiles, venues, courts, documents]
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
const getPresignedUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileName, fileType, folder } = req.body;
  
  if (!fileName || !fileType || !folder) {
    throw createError('fileName, fileType, and folder are required', 400);
  }
  
  const allowedFolders = ['profiles', 'venues', 'courts', 'documents'];
  if (!allowedFolders.includes(folder)) {
    throw createError('Invalid folder name', 400);
  }
  
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (!allowedMimeTypes.includes(fileType)) {
    throw createError('File type not allowed', 400);
  }
  
  const fileKey = generateFileKey(folder, req.user?.userId!, fileName);
  const presignedUrl = await generatePresignedUploadUrl(fileKey, fileType);
  
  res.status(200).json({
    success: true,
    data: {
      uploadUrl: presignedUrl,
      fileKey,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileKey}`,
    },
  });
});

router.post('/presigned-url', authenticate, getPresignedUrl);

export default router;