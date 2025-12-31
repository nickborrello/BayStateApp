import { render, screen } from '@testing-library/react';
import { StorefrontHeader } from '@/components/storefront/header';

// Mock the search provider
jest.mock('@/components/storefront/search-provider', () => ({
  useSearch: () => ({ openSearch: jest.fn() }),
}));

// Mock UserMenu to avoid complexity
jest.mock('@/components/auth/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />
}));

describe('StorefrontHeader', () => {
  it('renders the logo with store name', () => {
    render(<StorefrontHeader user={null} />);
    expect(screen.getByText('Bay State')).toBeInTheDocument();
  });

  it('renders search button with accessible label', () => {
    render(<StorefrontHeader user={null} />);
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('renders cart button with accessible label', () => {
    render(<StorefrontHeader user={null} />);
    expect(screen.getByRole('button', { name: /shopping cart/i })).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    render(<StorefrontHeader user={null} />);
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  });

  it('renders menu button for mobile', () => {
    render(<StorefrontHeader user={null} />);
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('renders user menu', () => {
    render(<StorefrontHeader user={null} />);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('is hidden on mobile and visible on desktop', () => {
    const { container } = render(<StorefrontHeader user={null} />);
    const headerElement = container.querySelector('header');
    // Using max-md:hidden to hide on mobile only
    expect(headerElement).toHaveClass('max-md:hidden');
  });
});
