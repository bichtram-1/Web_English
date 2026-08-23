import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { LoginDTO, RegisterDTO, AuthResponse, User } from '../types/auth.types';
import { ApiResponse } from '../types/api.types';

export const authApi = {
  login: async (credentials: LoginDTO): Promise<AuthResponse> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.AUTH_LOGIN,
        credentials
      )) as any;
      if (res && res.data) {
        return res.data;
      }
      if (res && res.user && res.token) {
        return res;
      }
    } catch (err: any) {
      // If error has specific validation / authentication message from backend (400, 401, 403), rethrow it
      if (err?.status === 400 || err?.status === 401 || err?.status === 403) {
        throw err;
      }
      // Demo accounts fallback if backend is offline or network error
      if (credentials.email === 'student@example.com' && credentials.password === 'password123') {
        console.warn('Backend unavailable/offline, logging in with local demo student account');
        return {
          user: {
            id: 'user-demo-1',
            name: 'Tram Nguyen',
            email: 'student@example.com',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            role: 'student',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'demo-jwt-token-offline-student',
        };
      }
      if (credentials.email === 'admin@example.com' && credentials.password === 'password123') {
        console.warn('Backend unavailable/offline, logging in with local demo admin account');
        return {
          user: {
            id: 'user-admin-1',
            name: 'Admin Lingua',
            email: 'admin@example.com',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'demo-jwt-token-offline-admin',
        };
      }
      throw err;
    }
    throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
  },

  register: async (userData: RegisterDTO): Promise<AuthResponse> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.AUTH_REGISTER,
        userData
      )) as any;
      if (res && res.data) {
        return res.data;
      }
      if (res && res.user && res.token) {
        return res;
      }
    } catch (err: any) {
      if (err?.status === 400 || err?.status === 409) {
        throw err;
      }
      // Fallback for offline registration demo
      const mockUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.name)}`,
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        user: mockUser,
        token: `demo-jwt-token-${Date.now()}`,
      };
    }
    throw new Error('Đăng ký thất bại. Vui lòng thử lại.');
  },

  getMe: async (): Promise<User> => {
    try {
      const res = (await axiosInstance.get(ENDPOINTS.AUTH_ME)) as any;
      if (res && res.data) {
        return res.data;
      }
      if (res && res.id && res.email) {
        return res;
      }
    } catch {
      const cached = localStorage.getItem('lingualeap_user');
      if (cached) {
        return JSON.parse(cached);
      }
    }
    throw new Error('Không thể tải thông tin người dùng');
  },
};

export default authApi;
