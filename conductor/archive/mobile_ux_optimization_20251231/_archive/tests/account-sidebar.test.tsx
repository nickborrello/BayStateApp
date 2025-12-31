import { render, screen } from '@testing-library/react';
import { AccountSidebar } from '@/components/account/account-sidebar';

// Mock usePathname
jest.mock('next/navigation', () => ({
    usePathname: () => '/account',
}));

// Mock signOutAction
jest.mock('@/lib/auth/actions', () => ({
    signOutAction: jest.fn(),
}));

describe('AccountSidebar', () => {
    it('renders all navigation items', () => {
        render(<AccountSidebar />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Addresses')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('Wishlist')).toBeInTheDocument();
    });

    it('has responsive classes for mobile horizontal scroll and desktop vertical layout', () => {
        const { container } = render(<AccountSidebar />);
        const nav = container.querySelector('nav');

        // Mobile classes (should fail initially)
        expect(nav).toHaveClass('flex-row');
        expect(nav).toHaveClass('overflow-x-auto');

        // Desktop classes (should fail or need adjustment)
        expect(nav).toHaveClass('md:flex-col');
    });
});
