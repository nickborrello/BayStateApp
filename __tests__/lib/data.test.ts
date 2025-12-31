/**
 * @jest-environment node
 */
import { getFeaturedProducts, getActiveServices, getBrands, getProducts } from '@/lib/data';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Data Fetching Functions', () => {
  const mockSelect = jest.fn();
  const mockFrom = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();
  const mockRange = jest.fn();
  const mockIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Chain mock
    mockLimit.mockReturnThis();
    mockRange.mockReturnThis();
    mockIn.mockResolvedValue({ data: [], error: null });
    mockOrder.mockReturnValue({ limit: mockLimit, range: mockRange, data: [], error: null });
    mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, data: [], error: null });
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, in: mockIn, data: [], error: null, count: 0 });
    mockFrom.mockReturnValue({ select: mockSelect });

    mockCreateClient.mockResolvedValue({
      from: mockFrom,
    } as never);
  });

  describe('getFeaturedProducts', () => {
    it('queries products table with featured filter', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      await getFeaturedProducts();

      expect(mockFrom).toHaveBeenCalledWith('products_published');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('is_featured', true);
    });

    it('returns empty array on error', async () => {
      mockLimit.mockResolvedValue({ data: null, error: { message: 'Test error' } });

      const result = await getFeaturedProducts();

      expect(result).toEqual([]);
    });

    it('respects limit parameter', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      await getFeaturedProducts(3);

      expect(mockLimit).toHaveBeenCalledWith(3);
    });
  });

  describe('getActiveServices', () => {
    it('queries services table with active filter', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await getActiveServices();

      expect(mockFrom).toHaveBeenCalledWith('services');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('returns empty array on error', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'Test error' } });

      const result = await getActiveServices();

      expect(result).toEqual([]);
    });
  });

  describe('getBrands', () => {
    it('queries brands table', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await getBrands();

      expect(mockFrom).toHaveBeenCalledWith('brands');
    });

    it('returns empty array on error', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'Test error' } });

      const result = await getBrands();

      expect(result).toEqual([]);
    });
  });

  describe('getProducts', () => {
    it('queries products with optional filters', async () => {
      mockRange.mockResolvedValue({ data: [], error: null, count: 0 });

      await getProducts({ brandId: 'test-id', stockStatus: 'in_stock', limit: 10, offset: 0 });

      expect(mockFrom).toHaveBeenCalledWith('products_published');
      expect(mockEq).toHaveBeenCalledWith('brand_id', 'test-id');
    });

    it('returns products and count', async () => {
      const mockProducts = [{ id: '1', name: 'Test Product' }];
      mockOrder.mockResolvedValue({ data: mockProducts, error: null, count: 1 });

      const result = await getProducts();

      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('count');
    });
  });
});
