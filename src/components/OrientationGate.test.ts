import { describe, it, expect } from 'vitest';
import { isViewportBlocked } from './OrientationGate';

describe('Orientation Gate & Usable Viewport Validation', () => {
  it('blocks mobile devices in portrait orientation', () => {
    // iPhone 12/13/14 portrait: 390 x 844
    expect(isViewportBlocked(390, 844)).toBe(true);

    // Pixel 7 portrait: 412 x 915
    expect(isViewportBlocked(412, 915)).toBe(true);

    // Samsung Galaxy S20 portrait: 360 x 800
    expect(isViewportBlocked(360, 800)).toBe(true);
  });

  it('blocks tablets in portrait orientation', () => {
    // iPad Mini portrait: 768 x 1024
    expect(isViewportBlocked(768, 1024)).toBe(true);

    // iPad Air portrait: 820 x 1180
    expect(isViewportBlocked(820, 1180)).toBe(true);

    // iPad Pro 12.9 portrait: 1024 x 1366
    expect(isViewportBlocked(1024, 1366)).toBe(true);
  });

  it('blocks landscape viewports with insufficient height (< 400px)', () => {
    // Landscape phone with short usable height (e.g. mobile browser address bar / notch)
    expect(isViewportBlocked(844, 390)).toBe(true);
    expect(isViewportBlocked(800, 360)).toBe(true);
    expect(isViewportBlocked(900, 399)).toBe(true);
  });

  it('blocks viewports with insufficient width (< 680px)', () => {
    expect(isViewportBlocked(679, 450)).toBe(true);
    expect(isViewportBlocked(500, 420)).toBe(true);
  });

  it('allows landscape viewports meeting both width >= 680 and height >= 400', () => {
    // Exact threshold
    expect(isViewportBlocked(680, 400)).toBe(false);

    // Modern landscape phone with generous viewport
    expect(isViewportBlocked(915, 412)).toBe(false);
    expect(isViewportBlocked(932, 430)).toBe(false);

    // Landscape tablets
    expect(isViewportBlocked(1024, 768)).toBe(false);
    expect(isViewportBlocked(1180, 820)).toBe(false);
    expect(isViewportBlocked(1366, 1024)).toBe(false);

    // Laptops and desktop monitors
    expect(isViewportBlocked(1280, 800)).toBe(false);
    expect(isViewportBlocked(1366, 768)).toBe(false);
    expect(isViewportBlocked(1440, 900)).toBe(false);
    expect(isViewportBlocked(1920, 1080)).toBe(false);
    expect(isViewportBlocked(2560, 1440)).toBe(false);
  });

  it('handles invalid or zero dimensions without throwing', () => {
    expect(isViewportBlocked(0, 0)).toBe(false);
    expect(isViewportBlocked(-100, 500)).toBe(false);
  });
});
