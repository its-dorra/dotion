export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string;
}
