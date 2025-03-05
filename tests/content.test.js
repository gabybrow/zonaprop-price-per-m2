// Import functions from content.js
const { extractNumber, isUSD, formatNumber, getCurrentExchangeRate, arsToUSD } = require('../content.js');

// Mock MutationObserver for Node.js environment
global.MutationObserver = class {
    constructor(callback) {}
    disconnect() {}
    observe(element, initObject) {}
};

// Mock document.body for Node.js environment
global.document = {
    body: {}
};

// Tests for content.js functionality
describe('Price calculation functions', () => {
  // Test extractNumber function with various formats
  test('extractNumber extracts numbers correctly', () => {
    expect(extractNumber('USD 100.000')).toBe(100000);
    expect(extractNumber('ARS 1.500.000')).toBe(1500000);
    expect(extractNumber('150 m²')).toBe(150);
    expect(extractNumber('1.234,56')).toBe(1234.56);
  });

  // Test isUSD function with different currency formats
  test('isUSD detects currency correctly', () => {
    expect(isUSD({ textContent: 'USD 100.000' })).toBe(true);
    expect(isUSD({ textContent: 'ARS 1.500.000' })).toBe(false);
    expect(isUSD({ textContent: 'U$S 50.000' })).toBe(true);
    expect(isUSD({ textContent: 'Pesos 500.000' })).toBe(false);
  });

  // Test formatNumber function with various numbers
  test('formatNumber formats numbers correctly', () => {
    expect(formatNumber(1234567.89)).toBe('1.234.567,89');
    expect(formatNumber(1000)).toBe('1.000,00');
    expect(formatNumber(99.9)).toBe('99,90');
    expect(formatNumber(1000000)).toBe('1.000.000,00');
  });

  // Test getCurrentExchangeRate function with API response
  test('getCurrentExchangeRate fetches rate correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          blue: { value_buy: 1190, value_sell: 1210 }
        })
      })
    );

    const rate = await getCurrentExchangeRate();
    expect(rate).toBe(1200); // Should be average of buy/sell
    expect(fetch).toHaveBeenCalledWith('https://api.bluelytics.com.ar/v2/latest');
  });

  // Test getCurrentExchangeRate error handling
  test('getCurrentExchangeRate handles errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject('API Error'));
    const rate = await getCurrentExchangeRate();
    expect(rate).toBe(1200); // Should return fallback rate
  });

  // Test arsToUSD function with various amounts
  test('arsToUSD converts currency correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          blue: { value_buy: 1190, value_sell: 1210 }
        })
      })
    );

    const usdAmount = await arsToUSD(1200000);
    expect(usdAmount).toBe(1000); // 1.2M ARS / 1200 = 1000 USD

    const smallAmount = await arsToUSD(12000);
    expect(smallAmount).toBe(10); // 12K ARS / 1200 = 10 USD
  });
});