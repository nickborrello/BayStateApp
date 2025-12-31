import { render, screen, fireEvent } from '@testing-library/react';
import { CampaignBanner } from '@/components/storefront/campaign-banner';

describe('CampaignBanner', () => {
  it('renders the message', () => {
    render(<CampaignBanner message="Test promotion" />);
    expect(screen.getByText('Test promotion')).toBeInTheDocument();
  });

  it('renders link when provided', () => {
    render(
      <CampaignBanner
        message="Sale!"
        linkText="Shop Now"
        linkHref="/sale"
      />
    );
    const link = screen.getByRole('link', { name: /shop now/i });
    expect(link).toHaveAttribute('href', '/sale');
  });

  it('can be dismissed', () => {
    render(<CampaignBanner message="Dismissible banner" />);
    expect(screen.getByText('Dismissible banner')).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Dismissible banner')).not.toBeInTheDocument();
  });

  it('applies variant styles', () => {
    const { container } = render(
      <CampaignBanner message="Seasonal" variant="seasonal" />
    );
    expect(container.firstChild).toHaveClass('bg-primary');
  });
});
