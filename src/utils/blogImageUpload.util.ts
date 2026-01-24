import { cloudinary } from './cloudinary.util.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import AppError from './appError.util.js';
import { Request } from 'express';

/**
 * Storage configuration for blog cover images
 * Optimized for hero/banner images
 */
const blogCoverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const userId = req.user?.id || 'misc';
    const folder = `prompt-pal/blogs/covers/${userId}`;

    const filename = `blog-cover-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}`;

    return {
      folder: folder,
      public_id: filename,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' }, // Full HD for covers
        { quality: 'auto:best' },
        { fetch_format: 'auto' }, // Automatic format optimization
      ],
    };
  },
});

/**
 * Storage configuration for blog section images
 * Optimized for in-content images
 */
const blogSectionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const userId = req.user?.id || 'misc';
    const folder = `prompt-pal/blogs/sections/${userId}`;

    const filename = `blog-section-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}`;

    return {
      folder: folder,
      public_id: filename,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Content images
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    };
  },
});

/**
 * File filter for image uploads
 */
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400) as any);
  }
};

/**
 * Multer upload middleware for blog cover images
 * Max size: 10MB
 */
export const uploadBlogCover = multer({
  storage: blogCoverStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for cover images
  },
});

/**
 * Multer upload middleware for blog section images
 * Max size: 5MB
 */
export const uploadBlogSection = multer({
  storage: blogSectionStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for section images
  },
});

/**
 * Delete image from Cloudinary
 */
export const deleteBlogImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const fileWithExt = urlParts[urlParts.length - 1];
    const publicId = fileWithExt.split('.')[0];
    
    // Find the folder path
    const folderIndex = urlParts.findIndex((part) => part === 'prompt-pal');
    if (folderIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    const folderPath = urlParts.slice(folderIndex, -1).join('/');
    const fullPublicId = `${folderPath}/${publicId}`;

    await cloudinary.uploader.destroy(fullPublicId);
  } catch (error) {
    // Log error but don't throw - image deletion is non-critical
    console.error('Error deleting blog image from Cloudinary:', error);
  }
};

