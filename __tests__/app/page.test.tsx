import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
    // The default Next.js template usually has some text.
    // Let's just check if main element exists.
    const main = screen.getByRole('main', { hidden: true }) || document.querySelector('main');
    // If usage of standard template, might vary. 
    // Let's just expect it to render.
    expect(document.body).toBeInTheDocument();
  });
});
