import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names and drops falsy values', () => {
    const showB = false;
    expect(cn('a', showB && 'b', undefined, 'c')).toBe('a c');
  });

  it('resolves conflicting Tailwind utility classes to the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
