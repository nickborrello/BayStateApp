import { render, screen } from '@testing-library/react';

// Mock the server action
jest.mock('@/app/admin/services/new/actions', () => ({
  createService: jest.fn(),
}));

import AddServicePage from '@/app/admin/services/new/page';

describe('Add Service Page', () => {
  it('renders Add New Service heading', () => {
    render(<AddServicePage />);
    expect(screen.getByText('Add New Service')).toBeInTheDocument();
  });

  it('renders service name input', () => {
    render(<AddServicePage />);
    expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
  });

  it('renders slug input', () => {
    render(<AddServicePage />);
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<AddServicePage />);
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('renders price input', () => {
    render(<AddServicePage />);
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
  });

  it('renders unit input', () => {
    render(<AddServicePage />);
    expect(screen.getByLabelText(/unit/i)).toBeInTheDocument();
  });

  it('renders active checkbox', () => {
    render(<AddServicePage />);
    expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
  });

  it('renders Create Service button', () => {
    render(<AddServicePage />);
    expect(screen.getByRole('button', { name: /create service/i })).toBeInTheDocument();
  });

  it('renders back link', () => {
    render(<AddServicePage />);
    expect(screen.getByRole('link', { name: /back to services/i })).toBeInTheDocument();
  });
});
