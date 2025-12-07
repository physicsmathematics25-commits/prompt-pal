import { z } from 'zod';
import { UserRole, UserStatus } from '../types/user.types.js';

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'superadmin'], {
    message: 'Role is required',
  }),
});

export const getUsersAdminSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'superadmin']).optional(),
  status: z.enum(['pending', 'approved', 'blocked']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(
    ['pending', 'approved', 'blocked'] as [UserStatus, ...UserStatus[]],
    {
      message: 'Status is required',
    },
  ),
});

export type GetUsersAdminQuery = z.infer<typeof getUsersAdminSchema>;

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
