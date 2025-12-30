import { render, screen } from '@testing-library/react';
import { StorefrontHeader } from '@/components/storefront/header';

describe('StorefrontHeader', () => {
  it('renders the logo with store name', () => {
    render(<StorefrontHeader />);
    expect(screen.getByText('Bay State')).toBeInTheDocument();
  });

  it('renders search button with accessible label', () => {
    render(<StorefrontHeader />);
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('renders cart button with accessible label', () => {
    render(<StorefrontHeader />);
    expect(screen.getByRole('button', { name: /shopping cart/i })).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    render(<StorefrontHeader />);
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  });

  it('renders menu button for mobile', () => {
    render(<StorefrontHeader />);
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });
});
