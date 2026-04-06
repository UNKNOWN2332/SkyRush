import type { ShopRegion } from '../lib/region';
import { v1Client } from './client';

export type CategoryDto = {
  id: number;
  name: string;
  logoUrl: string;
  hasZoneId: boolean;
  status: string;
  region?: string;
};

export type ProductDto = {
  id: number;
  categoryId: number;
  name: string;
  price: string;
  status: string;
};

export const catalogService = {
  getActiveCategories: async (region: ShopRegion, page = 0, size = 10): Promise<CategoryDto[]> => {
    const { data } = await v1Client.get<CategoryDto[]>('/categories', {
      params: { region, page, size },
    });
    return Array.isArray(data) ? data : [];
  },
  getProductsByCategory: async (categoryId: number, page = 0, size = 10): Promise<ProductDto[]> => {
    const { data } = await v1Client.get<ProductDto[]>(`/products/category/${categoryId}`, {
      params: { page, size },
    });
    return Array.isArray(data) ? data : [];
  },
};
