import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { LoginDTO, RegisterDTO, AuthResponse, User } from '../types/auth.types';
import { ApiResponse } from '../types/api.types';

export const authApi = {
  login: async (credentials: LoginDTO): Promise<AuthResponse> => {
    const res = (await axiosInstance.post(
      ENDPOINTS.AUTH_LOGIN,
      credentials
    )) as unknown as ApiResponse<AuthResponse>;
    return res.data;
  },

  register: async (userData: RegisterDTO): Promise<AuthResponse> => {
    const res = (await axiosInstance.post(
      ENDPOINTS.AUTH_REGISTER,
      userData
    )) as unknown as ApiResponse<AuthResponse>;
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = (await axiosInstance.get(ENDPOINTS.AUTH_ME)) as unknown as ApiResponse<User>;
    return res.data;
  },
};

export default authApi;
