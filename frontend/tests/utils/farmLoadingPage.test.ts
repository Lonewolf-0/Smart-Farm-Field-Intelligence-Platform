import { describe, it, expect } from 'vitest';
import { getFarmLoadingHTML } from '../../src/utils/farmLoadingPage';

describe('farmLoadingPage utility', () => {
  it('should return a non-empty string containing expected HTML structure', () => {
    const htmlString = getFarmLoadingHTML();

    // Check that it returns a non-empty string
    expect(typeof htmlString).toBe('string');
    expect(htmlString.length).toBeGreaterThan(0);

    // Check for key HTML elements
    expect(htmlString).toContain('<!DOCTYPE html>');
    expect(htmlString).toContain('<html lang="en">');
    expect(htmlString).toContain('<title>Generating Smart Farm Report');
    expect(htmlString).toContain('<div class="app-layout">');

    // Check for specific app layout parts
    expect(htmlString).toContain('<aside class="sidebar">');
    expect(htmlString).toContain('<div class="main-area">');

    // Check that it contains styles and scripts
    expect(htmlString).toContain('<style>');
    expect(htmlString).toContain('<script>');
  });
});
