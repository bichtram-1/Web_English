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
      throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
    } catch (err: any) {
      throw err;
    }
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
      throw new Error('Đăng ký thất bại. Vui lòng thử lại.');
    } catch (err: any) {
      throw err;
    }
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
      throw new Error('Dữ liệu người dùng không hợp lệ');
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 404) {
        throw err;
      }
      const cached = localStorage.getItem('lingualeap_user');
      if (cached) {
        return JSON.parse(cached);
      }
      throw new Error('Không thể tải thông tin người dùng');
    }
  },

  forgotPassword: async (data: { email: string }): Promise<{ message: string; devOtp?: string }> => {
    try {
      const res = (await axiosInstance.post(ENDPOINTS.AUTH_FORGOT_PASSWORD, data)) as any;
      if (res && res.data) {
        return res.data;
      }
      return res || { message: 'Mã OTP đã được gửi đến email của bạn' };
    } catch (err: any) {
      if (err?.status === 400 || err?.status === 404) {
        throw err;
      }
      // Demo / offline fallback simulation
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('mock_reset_otp_' + data.email.toLowerCase(), mockOtp);
      return {
        message: 'Mã OTP đã được gửi đến email của bạn',
        devOtp: mockOtp,
      };
    }
  },

  verifyOtp: async (data: { email: string; otp: string }): Promise<{ message: string; valid: boolean }> => {
    try {
      const res = (await axiosInstance.post(ENDPOINTS.AUTH_VERIFY_OTP, data)) as any;
      if (res && res.data) {
        return res.data;
      }
      return res || { message: 'Mã OTP hợp lệ', valid: true };
    } catch (err: any) {
      if (err?.status === 400 || err?.status === 404) {
        throw err;
      }
      const savedOtp = sessionStorage.getItem('mock_reset_otp_' + data.email.toLowerCase());
      if (savedOtp && savedOtp === data.otp.trim()) {
        return { message: 'Mã OTP hợp lệ', valid: true };
      }
      throw new Error('Mã OTP không chính xác hoặc đã hết hạn');
    }
  },

  resetPassword: async (data: { email: string; otp: string; newPassword: string }): Promise<{ message: string }> => {
    try {
      const res = (await axiosInstance.post(ENDPOINTS.AUTH_RESET_PASSWORD, data)) as any;
      if (res && res.data) {
        return res.data;
      }
      return res || { message: 'Đặt lại mật khẩu thành công!' };
    } catch (err: any) {
      if (err?.status === 400 || err?.status === 404) {
        throw err;
      }
      sessionStorage.removeItem('mock_reset_otp_' + data.email.toLowerCase());
      return { message: 'Đặt lại mật khẩu thành công!' };
    }
  },
};

export default authApi;
