import axios, { type AxiosInstance } from 'axios';

const apiRoot = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

function attachBearerAuth(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

/** `/api` — JWT qo‘shiladi (login dan keyin himoyalangan endpointlar uchun). */
export const apiClient = axios.create({ baseURL: apiRoot });
attachBearerAuth(apiClient);

/** `/api/v1` */
export const v1Client = axios.create({ baseURL: `${apiRoot}/v1` });
attachBearerAuth(v1Client);
