import { render, screen } from '@testing-library/react';
import HomePage from '@/app/(storefront)/page';

describe('Home Page', () => {
  it('renders the homepage with hero section', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bay State Pet & Garden');
  });

  it('renders Shop Now and Our Services buttons', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: /shop now/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /our services/i })).toBeInTheDocument();
  });

  it('renders category cards', () => {
    render(<HomePage />);
    expect(screen.getByText('Pet Supplies')).toBeInTheDocument();
    expect(screen.getByText('Garden & Lawn')).toBeInTheDocument();
    expect(screen.getByText('Propane & Grilling')).toBeInTheDocument();
  });
});
