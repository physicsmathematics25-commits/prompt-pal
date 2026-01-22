import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as userService from '../services/user.service.js';
import { UpdateProfileInput } from '../validation/user.schema.js';
import AppError from '../utils/appError.util.js';

export const userProfile = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

export const updateProfileHandler = catchAsync(
  async (req: Request<{}, {}, UpdateProfileInput>, res: Response) => {
    const forbidden = [
      'password',
      'passwordConfirm',
      'role',
      'status',
      'emailVerificationToken',
      'emailVerificationTokenExpires',
      'phoneOtp',
      'phoneOtpExpires',
      'passwordResetToken',
      'passwordResetExpires',
      'profileImage', // Handle via file upload, not body
    ];
    forbidden.forEach((f) => {
      if ((req.body as any)[f] !== undefined) delete (req.body as any)[f];
    });

    if (!req.user) {
      throw new AppError('User not found', 401);
    }

    // Get old profile image URL before update
    const oldProfileImageUrl = req.user.profileImage;

    // Prepare update payload
    const updatePayload: UpdateProfileInput = { ...req.body };

    // Handle file upload - if file is uploaded, use its URL
    if (req.file) {
      updatePayload.profileImage = req.file.path;
    }

    const user = await userService.updateProfile(
      req.user.id,
      updatePayload,
      oldProfileImageUrl,
    );

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  },
);
