import { render, screen } from '@testing-library/react';
import { AdminSidebar } from '@/components/admin/sidebar';

// Test the sidebar component directly since the layout is now async/server
describe('Admin Layout', () => {
  it('renders side navigation with links for admin role', () => {
    render(<AdminSidebar userRole="admin" />);

    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  it('hides admin-only links for staff role', () => {
    render(<AdminSidebar userRole="staff" />);

    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();

    // Staff should NOT see Users and Settings
    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
  });

  it('shows role indicator', () => {
    render(<AdminSidebar userRole="admin" />);
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
});
