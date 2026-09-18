// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { createPropertyPopupContent } from '@/lib/property-map-dom';

describe('property map popup', () => {
  it('renders database text without interpreting HTML', () => {
    const content = createPropertyPopupContent({
      id: 'property-1',
      title: '<img src=x onerror=alert(1)>',
      address: '<script>alert(1)</script>',
      city: 'São Paulo',
      value: 100_000,
      status: 'available',
      type: 'apartment',
    });

    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('img')).toBeNull();
    expect(content.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(content.textContent).toContain('<script>alert(1)</script>');
  });

  it('uses a scoped click handler instead of a global window callback', () => {
    const onSelect = vi.fn();
    const content = createPropertyPopupContent({
      id: 'property-1',
      title: 'Imóvel',
      address: 'Rua A',
      city: 'São Paulo',
      value: 100_000,
      status: 'available',
    }, onSelect);

    content.querySelector('button')?.click();
    expect(onSelect).toHaveBeenCalledWith('property-1');
    expect('selectProperty' in window).toBe(false);
  });
});
