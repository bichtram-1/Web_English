export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
}

export interface ResetPasswordDTO {
  email: string;
  otp: string;
  newPassword: string;
}

