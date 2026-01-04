import { render, screen } from '@testing-library/react';
import EditProductPage from '@/app/admin/products/[id]/edit/page';

// Mock params
const params = { id: '123' };

// Mock createClient
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: '123', name: 'Existing Product', slug: 'existing', price: 10 },
      error: null
    }),
  }),
}));

jest.mock('@/app/admin/products/[id]/edit/actions', () => ({
  updateProduct: jest.fn(),
}));

describe('Edit Product Page', () => {
  it('pre-fills form with product data', async () => {
    // Next.js 15+ pages receive params as a Promise
    const Page = await EditProductPage({ params: Promise.resolve(params) });
    render(Page);

    expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });
});
