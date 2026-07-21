export type Role = 'Admin' | 'User';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  user: UserSummary;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Role[];
  createdAtUtc: string;
  lastLoginUtc: string | null;
}

export interface DashboardSummary {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  newUsersLast7Days: number;
}

export interface ApiErrorBody {
  message?: string;
  errors?: string[];
}
