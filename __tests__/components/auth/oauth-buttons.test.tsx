import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { loginWithOAuth } from '@/lib/auth/actions';

jest.mock('@/lib/auth/actions', () => ({
    loginWithOAuth: jest.fn(),
}));

describe('OAuthButtons', () => {
    it('renders Google, Apple, and Facebook buttons', () => {
        render(<OAuthButtons />);
        expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /apple/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /facebook/i })).toBeInTheDocument();
    });

    it('calls loginWithOAuth with correct provider', async () => {
        render(<OAuthButtons />);

        fireEvent.click(screen.getByRole('button', { name: /google/i }));

        await waitFor(() => {
            expect(loginWithOAuth).toHaveBeenCalledWith('google');
        });

        fireEvent.click(screen.getByRole('button', { name: /facebook/i }));

        await waitFor(() => {
            expect(loginWithOAuth).toHaveBeenCalledWith('facebook');
        });
    });
});
