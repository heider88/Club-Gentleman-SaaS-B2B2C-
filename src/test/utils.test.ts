import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('utils cn()', () => {
  it('merges tailwind classes properly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500'); // tailwind-merge resolves conflicts
    expect(cn('p-4', { 'mt-4': true, 'mb-4': false })).toBe('p-4 mt-4');
  });
});
