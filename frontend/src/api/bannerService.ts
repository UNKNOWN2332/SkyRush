import type { ShopRegion } from '../lib/region';
import { v1Client } from './client';

export type PromoBannerDto = {
  id: number;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  region: string;
};

export const bannerService = {
  getActiveBanners: async (region: ShopRegion): Promise<PromoBannerDto[]> => {
    const { data } = await v1Client.get<PromoBannerDto[]>('/banners', {
      params: { region },
    });
    return Array.isArray(data) ? data : [];
  },
};
