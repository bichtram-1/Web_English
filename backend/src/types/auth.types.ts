export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string | null;
  role: 'student' | 'teacher' | 'admin' | string;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}
