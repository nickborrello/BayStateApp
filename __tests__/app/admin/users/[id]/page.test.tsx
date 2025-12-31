import { render, screen } from '@testing-library/react';
import UserDetailsPage from '@/app/admin/users/[id]/page';
import { getProfile } from '@/lib/auth/roles';

jest.mock('@/lib/auth/roles', () => ({
    getProfile: jest.fn()
}));

jest.mock('@/components/admin/user-role-select', () => ({
    UserRoleSelect: () => <div data-testid="role-select" />
}));

describe('UserDetailsPage', () => {
    it('renders user details', async () => {
        (getProfile as jest.Mock).mockResolvedValue({
            id: '123',
            full_name: 'John Doe',
            email: 'john@example.com',
            role: 'customer',
            created_at: new Date().toISOString()
        });

        // Mock params
        const params = Promise.resolve({ id: '123' });
        const jsx = await UserDetailsPage({ params });
        render(jsx);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByTestId('role-select')).toBeInTheDocument();
        expect(screen.getByText('Order History (Coming Soon)')).toBeInTheDocument();
    });

    it('renders not found if user missing', async () => {
        (getProfile as jest.Mock).mockResolvedValue(null);

        const params = Promise.resolve({ id: '999' });
        const jsx = await UserDetailsPage({ params });
        render(jsx);

        expect(screen.getByText('User not found')).toBeInTheDocument();
    });
});
