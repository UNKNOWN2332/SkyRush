import axios from 'axios';

const USER_STORAGE_KEY = 'skyrush_user';

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

export function getStoredUser(): UserResponse | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserResponse;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem('token')) && getStoredUser() !== null;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem(USER_STORAGE_KEY);
}

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
      if (response.data?.user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
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
