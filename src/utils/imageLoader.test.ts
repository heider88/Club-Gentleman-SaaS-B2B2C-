import { describe, it, expect } from 'vitest';
import customImageLoader from './imageLoader';

describe('customImageLoader', () => {
  it('should format external URLs correctly using wsrv.nl', () => {
    const src = 'https://example.supabase.co/storage/v1/object/public/images/test.jpg';
    const width = 800;
    const quality = 80;
    const result = customImageLoader({ src, width, quality });
    expect(result).toBe('https://wsrv.nl/?url=https%3A%2F%2Fexample.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fimages%2Ftest.jpg&w=800&q=80&output=webp');
  });

  it('should format external URLs correctly with default quality', () => {
    const src = 'https://images.unsplash.com/photo-123';
    const width = 400;
    const result = customImageLoader({ src, width });
    expect(result).toBe('https://wsrv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-123&w=400&q=75&output=webp');
  });

  it('should return local paths unmodified', () => {
    const src = '/images/local-logo.png';
    const width = 200;
    const result = customImageLoader({ src, width });
    expect(result).toBe('/images/local-logo.png');
  });
});
