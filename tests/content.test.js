// Import functions from content.js
const { extractNumber, isUSD, formatNumber, getCurrentExchangeRate, arsToUSD, extractSurfaceArea } = require('../content.js');

// Mock MutationObserver for Node.js environment
global.MutationObserver = class {
    constructor(callback) {}
    disconnect() {}
    observe(element, initObject) {}
};

// Mock a basic DOM element
function mockDOMElement(props = {}) {
    return {
        getAttribute: (attr) => props[attr] || null,
        querySelector: props.querySelector || (() => null),
        querySelectorAll: props.querySelectorAll || (() => []),
        textContent: props.textContent || '',
        className: props.className || '',
        attributes: props.attributes || []
    };
}

// Mock document.body for Node.js environment
global.document = {
    body: {},
    createElement: () => ({
        style: {},
        className: '',
        appendChild: () => {}
    }),
    querySelector: () => null,
    querySelectorAll: () => []
};

// Tests for content.js functionality
describe('Price calculation functions', () => {
    // Test extractNumber function with various formats
    test('extractNumber extracts numbers correctly', () => {
        expect(extractNumber('USD 100.000')).toBe(100000);
        expect(extractNumber('ARS 1.500.000')).toBe(1500000);
        expect(extractNumber('150 m²')).toBe(150);
        expect(extractNumber('1.234,56')).toBe(1234.56);
        expect(extractNumber('45,5 m²')).toBe(45.5);
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

    // Test extractSurfaceArea function with various HTML structures
    test('extractSurfaceArea finds surface area in different locations', () => {
        // Mock card with data-qa attribute
        const cardWithDataQA = mockDOMElement({
            'data-id': 'test-1',
            querySelector: (selector) => {
                if (selector === '[data-qa="posting-card-feature-surface"]') {
                    return { textContent: '100 m²' };
                }
                return null;
            },
            querySelectorAll: () => [],
            textContent: '100 m²'
        });
        expect(extractSurfaceArea(cardWithDataQA)).toBe('100 m²');

        // Mock card with features container
        const cardWithFeatures = mockDOMElement({
            'data-id': 'test-2',
            querySelector: (selector) => {
                if (selector === '.postingFeatures-module__features') {
                    return { textContent: '2 dormitorios • 80 m² • 1 baño' };
                }
                return null;
            },
            querySelectorAll: () => [],
            textContent: '2 dormitorios • 80 m² • 1 baño'
        });
        expect(extractSurfaceArea(cardWithFeatures)).toBe('2 dormitorios • 80 m² • 1 baño');

        // Mock card with feature spans
        const cardWithSpans = mockDOMElement({
            'data-id': 'test-3',
            querySelector: () => null,
            querySelectorAll: () => [
                { textContent: '2 dormitorios' },
                { textContent: '75 m²' },
                { textContent: '1 baño' }
            ],
            textContent: '2 dormitorios 75 m² 1 baño'
        });
        expect(extractSurfaceArea(cardWithSpans)).toBe('75 m²');
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
        expect(fetch).toHaveBeenCalledWith('https://api.bluelytics.com.ar/v2/latest', { timeout: 5000 });
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

describe('Surface area detection', () => {
    test('extractSurfaceArea finds surface area with data-qa attribute', () => {
        const card = mockDOMElement({
            'data-id': 'test-1',
            querySelector: (selector) => {
                if (selector === '[data-qa="posting-card-feature-surface"]') {
                    return { textContent: '100 m²' };
                }
                return null;
            },
            querySelectorAll: () => []
        });
        expect(extractSurfaceArea(card)).toBe('100 m²');
    });

    test('extractSurfaceArea finds surface area in features container', () => {
        const card = mockDOMElement({
            'data-id': 'test-2',
            querySelector: (selector) => {
                if (selector === '.postingFeatures-module__features') {
                    return { textContent: '2 dormitorios • 80 m² • 1 baño' };
                }
                return null;
            },
            querySelectorAll: () => []
        });
        expect(extractSurfaceArea(card)).toBe('2 dormitorios • 80 m² • 1 baño');
    });

    test('extractSurfaceArea finds surface area in individual features', () => {
        const card = mockDOMElement({
            'data-id': 'test-3',
            querySelector: () => null,
            querySelectorAll: (selector) => {
                if (selector === '[data-qa="posting-card-features-features"]') {
                    return [
                        { textContent: '2 dormitorios' },
                        { textContent: '75 m²' },
                        { textContent: '1 baño' }
                    ];
                }
                return [];
            }
        });
        expect(extractSurfaceArea(card)).toBe('75 m²');
    });

    test('extractSurfaceArea handles invalid inputs gracefully', () => {
        expect(extractSurfaceArea(null)).toBe(null);
        expect(extractSurfaceArea({})).toBe(null);
        expect(extractSurfaceArea({ textContent: 'no surface area' })).toBe(null);
    });
});