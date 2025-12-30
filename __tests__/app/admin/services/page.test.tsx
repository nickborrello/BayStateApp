import { render, screen } from '@testing-library/react';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Propane Refill',
              slug: 'propane-refill',
              description: 'Tank refills',
              price: 19.99,
              unit: 'tank',
              is_active: true,
            },
            {
              id: '2',
              name: 'Knife Sharpening',
              slug: 'knife-sharpening',
              description: 'Professional sharpening',
              price: 5.00,
              unit: 'knife',
              is_active: false,
            },
          ],
          error: null,
        }),
      }),
    }),
  }),
}));

import AdminServicesPage from '@/app/admin/services/page';

describe('Admin Services Page', () => {
  it('renders services heading', async () => {
    const page = await AdminServicesPage();
    render(page);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Services');
  });

  it('renders Add Service button', async () => {
    const page = await AdminServicesPage();
    render(page);
    expect(screen.getByRole('link', { name: /add service/i })).toBeInTheDocument();
  });

  it('renders service cards', async () => {
    const page = await AdminServicesPage();
    render(page);
    expect(screen.getByText('Propane Refill')).toBeInTheDocument();
    expect(screen.getByText('Knife Sharpening')).toBeInTheDocument();
  });

  it('shows active/inactive badges', async () => {
    const page = await AdminServicesPage();
    render(page);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders edit buttons for each service', async () => {
    const page = await AdminServicesPage();
    render(page);
    const editLinks = screen.getAllByRole('link', { name: '' });
    expect(editLinks.length).toBeGreaterThan(0);
  });
});
