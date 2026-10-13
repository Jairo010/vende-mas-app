/** `GET /api/v1/users` item (only the fields the app reads). */
export interface UserSummaryResponseDto {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface FindUsersQueryDto {
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
