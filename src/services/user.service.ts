import User from '../models/user.model.js';
import AppError from '../utils/appError.util.js';
import { UpdateProfileInput } from '../validation/user.schema.js';
import { UserRole, UserStatus } from '../types/user.types.js';
import { GetUsersAdminQuery } from '../validation/admin.validation.js';
import { cloudinary } from '../utils/cloudinary.util.js';
import logger from '../config/logger.config.js';

export const updateProfile = async (
  userId: string,
  payload: UpdateProfileInput,
  oldProfileImageUrl?: string,
) => {
  // If updating profile image, delete old image from Cloudinary
  if (payload.profileImage && oldProfileImageUrl) {
    // Don't delete if it's the default image
    const DEFAULT_PROFILE_IMAGE =
      'https://res.cloudinary.com/dxhkryxzk/image/upload/v1755980278/avatar2_bkwawy.png';
    
    if (oldProfileImageUrl !== DEFAULT_PROFILE_IMAGE) {
      try {
        const url = oldProfileImageUrl;
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)/);
        
        if (match && match[1]) {
          const publicIdWithFolder = match[1].replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
          
          if (publicIdWithFolder) {
            await cloudinary.api.delete_resources([publicIdWithFolder]);
            logger.info(`[Cloudinary]: Deleted old profile image ${publicIdWithFolder} for user ${userId}`);
          }
        }
      } catch (error: any) {
        logger.error(
          error,
          `[Cloudinary]: Failed to delete old profile image for user ${userId}`,
        );
        // Don't throw error - continue with update even if deletion fails
      }
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true, runValidators: true },
  );

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateUserRole = async (
  targetUserId: string,
  newRole: UserRole,
  currentUserId: string,
) => {
  if (targetUserId === currentUserId) {
    throw new AppError('You cannot change your own role.', 400);
  }

  const user = await User.findById(targetUserId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.role = newRole;
  await user.save();

  return user;
};

export const getAllUsersAdmin = async (query: GetUsersAdminQuery) => {
  const { search, role, status, page, limit } = query;

  const filter: any = {};

  if (role) filter.role = role;
  if (status) filter.status = status;

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .setOptions({ includeInactive: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('+status +active');

  const totalUsers = await User.countDocuments(filter).setOptions({
    includeInactive: true,
  });

  return {
    users,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    totalUsers,
  };
};

export const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await User.findById(userId).setOptions({
    includeInactive: true,
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.role === 'superadmin' && status === 'blocked') {
    throw new AppError('You cannot block a Superadmin.', 403);
  }

  user.status = status;
  await user.save();

  return user;
};

export const getUserByIdAdmin = async (userId: string) => {
  const user = await User.findById(userId)
    .setOptions({ includeInactive: true })
    .select('+active +status');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return { user };
};
