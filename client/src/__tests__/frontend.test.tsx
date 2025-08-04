// Frontend UI tests (Jest + React Testing Library)
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders main navigation', () => {
    render(<App />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
