import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByRole } = render(<Button>Test Button</Button>);
    expect(getByRole('button', { name: /test button/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const { getByRole } = render(<Button disabled>Disabled Button</Button>);
    expect(getByRole('button')).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { getByRole } = render(<Button variant="destructive">Destructive Button</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });
});