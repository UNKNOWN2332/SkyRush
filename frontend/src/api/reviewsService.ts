import axios from 'axios';
import { v1Client } from './client';

export type ReviewDto = {
  id: number;
  authorUsername: string;
  rating: number;
  body: string;
  categoryId: number | null;
  productId: number | null;
  createdAt: string | null;
};

const publicV1 = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'}/v1`,
});

export const reviewsService = {
  list: async (page = 0, size = 100): Promise<ReviewDto[]> => {
    const { data } = await publicV1.get<ReviewDto[]>('/reviews', { params: { page, size } });
    return Array.isArray(data) ? data : [];
  },

  create: async (payload: {
    rating: number;
    body: string;
    categoryId?: number | null;
    productId?: number | null;
  }): Promise<ReviewDto> => {
    const { data } = await v1Client.post<ReviewDto>('/reviews', {
      rating: payload.rating,
      body: payload.body,
      categoryId: payload.categoryId ?? null,
      productId: payload.productId ?? null,
    });
    return data;
  },
};
