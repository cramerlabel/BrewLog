import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its children as text content', () => {
    render(<Badge>Fermenting</Badge>);
    expect(screen.getByText('Fermenting')).toBeInTheDocument();
  });
});
