import { test, expect } from '@playwright/test';
import { generateQAUser } from './helpers.js';

test.describe('Optional AI and OCR Capabilities', () => {
  test('evaluates AI voice parsing or bill OCR when GEMINI_API_KEY is provided', async ({ request }) => {
    test.skip(
      !process.env.GEMINI_API_KEY,
      'Skipping optional AI/OCR tests: GEMINI_API_KEY environment variable is not configured in this environment.'
    );

    const user = generateQAUser();
    const regRes = await request.post('/api/auth/register', { data: user });
    const authData = await regRes.json();
    const token = authData.token;
    const storeId = authData.storeId;

    const aiRes = await request.post('/api/ai/voice-entry', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-store-id': storeId,
      },
      data: {
        transcript: 'Sold 2 bags of sugar to Ramesh for 100 rupees in cash',
      },
    });

    expect(aiRes.status()).toBe(200);
    const aiJson = await aiRes.json();
    expect(aiJson.success).toBe(true);
  });
});
