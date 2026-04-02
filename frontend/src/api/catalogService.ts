import axios from 'axios';

export type CategoryDto = {
  id: number;
  name: string;
  logoUrl: string;
  hasZoneId: boolean;
  status: string;
};

export type ProductDto = {
  id: number;
  categoryId: number;
  name: string;
  price: string;
  status: string;
};

const v1 = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'}/v1`,
});

export const catalogService = {
  getActiveCategories: async (): Promise<CategoryDto[]> => {
    const { data } = await v1.get<CategoryDto[]>('/categories');
    return Array.isArray(data) ? data : [];
  },
  getProductsByCategory: async (categoryId: number): Promise<ProductDto[]> => {
    const { data } = await v1.get<ProductDto[]>(`/products/category/${categoryId}`);
    return Array.isArray(data) ? data : [];
  },
};
