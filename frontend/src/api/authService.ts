import axios from 'axios';

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type BaseMessage = {
  code: number;
  message: string | null;
};

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  goldCoins: number;
  createdAt?: string | null;
};

export type LoginResponse = {
  token: string;
  user: UserResponse;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
});

const toBaseMessage = (error: unknown): BaseMessage => {
  const data = (error as any)?.response?.data ?? (error as any);
  if (data && typeof data.code === 'number') {
    return {
      code: data.code,
      message: typeof data.message === 'string' ? data.message : null,
    };
  }
  return { code: -1, message: "Noma'lum xatolik" };
};

export const authService = {
  login: async (loginData: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', loginData);
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw toBaseMessage(error);
    }
  },
  register: async (registerData: RegisterRequest): Promise<UserResponse> => {
    try {
      const response = await api.post<UserResponse>('/auth/register', registerData);
      return response.data;
    } catch (error) {
      throw toBaseMessage(error);
    }
  },
};
