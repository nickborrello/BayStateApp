import { render, screen } from '@testing-library/react';
import { AdminSidebar } from '@/components/admin/sidebar';

// Test the sidebar component directly since the layout is now async/server
describe('Admin Layout', () => {
  it('renders side navigation with links for admin role', () => {
    render(<AdminSidebar userRole="admin" />);

    // Check for key navigation items (using exact text to avoid collisions)
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('hides admin-only links for staff role', () => {
    render(<AdminSidebar userRole="staff" />);

    // Non-admin items should be visible
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();

    // Staff should NOT see Users and Settings
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  });

  it('shows role indicator', () => {
    render(<AdminSidebar userRole="admin" />);
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
});
