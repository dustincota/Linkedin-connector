/**
 * Human-like behavior utilities for LinkedIn automation
 *
 * Critical for avoiding detection:
 * - Gaussian random delays (not uniform)
 * - Variable typing speeds
 * - Random mouse movements and scrolls
 * - Working hours enforcement
 * - Daily action limits
 */

/**
 * Generate a random delay using Gaussian (normal) distribution
 * More realistic than uniform random
 */
export function gaussianDelay(mean: number, stdDev: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  const delay = mean + stdDev * z0;
  return Math.max(100, Math.floor(delay)); // Min 100ms
}

/**
 * Sleep with Gaussian distribution
 * @param meanMs - Mean delay in milliseconds
 * @param stdDevMs - Standard deviation in milliseconds
 */
export async function sleep(meanMs: number, stdDevMs: number = meanMs * 0.2) {
  const delay = gaussianDelay(meanMs, stdDevMs);
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Human-like typing with variable speed
 * Each character has slightly different delay
 */
export function getTypingDelay(): number {
  // Average human typing: 40-80ms per character
  return gaussianDelay(60, 15);
}

/**
 * Check if current time is within working hours
 */
export function isWithinWorkingHours(
  workingHoursStart: string = '09:00',
  workingHoursEnd: string = '17:00',
  workingDays: number[] = [1, 2, 3, 4, 5], // Monday-Friday
  timezone: string = 'America/New_York'
): boolean {
  const now = new Date();

  // Check if today is a working day (0=Sunday, 6=Saturday)
  const dayOfWeek = now.getDay();
  if (!workingDays.includes(dayOfWeek)) {
    return false;
  }

  // Parse working hours
  const [startHour, startMinute] = workingHoursStart.split(':').map(Number);
  const [endHour, endMinute] = workingHoursEnd.split(':').map(Number);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const currentTime = currentHour * 60 + currentMinute;
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Random skip - 5% chance to skip an action
 * Makes automation less predictable
 */
export function shouldSkipAction(): boolean {
  return Math.random() < 0.05; // 5% skip rate
}

/**
 * Generate random scroll amount
 */
export function getRandomScrollAmount(): number {
  return gaussianDelay(300, 100); // Scroll 200-400px typically
}

/**
 * Generate random mouse movement coordinates
 */
export function getRandomMouseMovement(
  maxX: number,
  maxY: number
): { x: number; y: number } {
  return {
    x: Math.floor(Math.random() * maxX),
    y: Math.floor(Math.random() * maxY),
  };
}

/**
 * Delay between major actions (1-3 minutes)
 */
export async function delayBetweenActions() {
  const meanMs = 120000; // 2 minutes
  const stdDevMs = 30000; // 30 seconds
  await sleep(meanMs, stdDevMs);
}

/**
 * Short pause before action (like human hesitation)
 */
export async function shortPause() {
  await sleep(800, 200); // ~0.8 seconds
}

/**
 * Reading delay - simulates reading content
 * @param contentLength - Length of content to "read"
 */
export async function readingDelay(contentLength: number) {
  // Average reading speed: 200-250 words per minute
  // Assume 5 characters per word
  const words = contentLength / 5;
  const minutes = words / 225; // 225 words per minute
  const ms = minutes * 60 * 1000;

  // Add some randomness
  await sleep(Math.max(1000, ms), ms * 0.3);
}
