// Accessibility tests using jest-axe
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../App';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('App should have no accessibility violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
