import { render, screen } from '@testing-library/react';

// Mock the server actions
jest.mock('@/app/admin/services/[id]/edit/actions', () => ({
  updateService: jest.fn(),
  toggleServiceActive: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: '1',
              name: 'Propane Refill',
              slug: 'propane-refill',
              description: 'Tank refills available',
              price: 19.99,
              unit: 'tank',
              is_active: true,
            },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

import EditServicePage from '@/app/admin/services/[id]/edit/page';

describe('Edit Service Page', () => {
  it('renders Edit Service heading', async () => {
    const page = await EditServicePage({ params: Promise.resolve({ id: '1' }) });
    render(page);
    expect(screen.getByText('Edit Service')).toBeInTheDocument();
  });

  it('renders service name with default value', async () => {
    const page = await EditServicePage({ params: Promise.resolve({ id: '1' }) });
    render(page);
    const nameInput = screen.getByLabelText(/service name/i);
    expect(nameInput).toHaveValue('Propane Refill');
  });

  it('renders active badge', async () => {
    const page = await EditServicePage({ params: Promise.resolve({ id: '1' }) });
    render(page);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Deactivate button for active service', async () => {
    const page = await EditServicePage({ params: Promise.resolve({ id: '1' }) });
    render(page);
    expect(screen.getByRole('button', { name: /deactivate/i })).toBeInTheDocument();
  });

  it('renders Update Service button', async () => {
    const page = await EditServicePage({ params: Promise.resolve({ id: '1' }) });
    render(page);
    expect(screen.getByRole('button', { name: /update service/i })).toBeInTheDocument();
  });

  it('renders back link', async () => {
    const page = await EditServicePage({ params: Promise.resolve({ id: '1' }) });
    render(page);
    expect(screen.getByRole('link', { name: /back to services/i })).toBeInTheDocument();
  });
});
