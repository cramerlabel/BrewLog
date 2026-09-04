import type { UserRole } from '@brewlog/shared';

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
