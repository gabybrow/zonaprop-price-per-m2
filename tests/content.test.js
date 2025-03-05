// Tests for content.js functionality
describe('Price calculation functions', () => {
  // Test extractNumber function
  test('extractNumber extracts numbers correctly', () => {
    expect(extractNumber('USD 100.000')).toBe(100000);
    expect(extractNumber('ARS 1.500.000')).toBe(1500000);
    expect(extractNumber('150 m²')).toBe(150);
  });

  // Test isUSD function
  test('isUSD detects currency correctly', () => {
    const usdElement = { textContent: 'USD 100.000' };
    const arsElement = { textContent: 'ARS 1.500.000' };
    
    expect(isUSD(usdElement)).toBe(true);
    expect(isUSD(arsElement)).toBe(false);
  });

  // Test formatNumber function
  test('formatNumber formats numbers correctly', () => {
    expect(formatNumber(1234567.89)).toBe('1.234.567,89');
    expect(formatNumber(1000)).toBe('1.000,00');
  });

  // Test getCurrentExchangeRate function
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

  // Test arsToUSD function
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
  });
});
