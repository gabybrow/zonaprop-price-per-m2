// Function to extract numbers from string and remove dots
function extractNumber(str) {
    if (!str || typeof str !== 'string') {
        console.warn('Invalid input to extractNumber:', str);
        return 0;
    }
    
    str = str.trim();
    
    try {
        // Handle decimal numbers with comma (European format)
        if (str.includes(',')) {
            // First remove any thousand separators (dots)
            let cleanedStr = str.replace(/\./g, '');
            // Then replace comma with dot for decimal point
            cleanedStr = cleanedStr.replace(',', '.');
            // Extract the number
            const matches = cleanedStr.match(/\d+(?:\.\d+)?/);
            if (matches && matches.length > 0) {
                return parseFloat(matches[0]);
            }
        }
        
        // Handle numbers with dots as thousand separators
        const matches = str.replace(/\./g, '').match(/\d+/g);
        if (matches && matches.length > 0) {
            return parseFloat(matches[0]);
        }
        
        // Fallback - just try to extract any number
        const fallbackMatches = str.match(/\d+/g);
        if (fallbackMatches && fallbackMatches.length > 0) {
            return parseFloat(fallbackMatches[0]);
        }
        
        return 0;
    } catch (error) {
        console.error('Error in extractNumber:', error);
        return 0;
    }
}

// Function to check if price is in USD or ARS
function isUSD(priceElement) {
    if (!priceElement || !priceElement.textContent) {
        return false;
    }
    
    const text = priceElement.textContent.toUpperCase();
    return text.includes('USD') || 
           text.includes('U$S') || 
           text.includes('U$D') || 
           text.includes('DÓLAR') || 
           text.includes('DOLAR') ||
           text.includes('$') && !text.includes('$AR') && !text.includes('ARS');
}

// Function to fetch current exchange rate
async function getCurrentExchangeRate() {
    try {
        // Try multiple exchange rate APIs
        const apiUrls = [
            'https://api.bluelytics.com.ar/v2/latest',
            'https://dolarapi.com/v1/dolares/blue' // Alternative API
        ];
        
        let exchangeRate = null;
        
        // Try the primary API first
        try {
            const response = await fetch(apiUrls[0], { timeout: 5000 });
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const data = await response.json();
            // Using blue rate (informal market rate) as it's closer to dolarhoy.com values
            exchangeRate = (data.blue.value_buy + data.blue.value_sell) / 2;
            console.log('Exchange rate from primary API:', exchangeRate);
        } catch (primaryError) {
            console.warn('Primary exchange rate API failed:', primaryError);
            
            // Try the backup API
            try {
                const response = await fetch(apiUrls[1], { timeout: 5000 });
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                
                const data = await response.json();
                exchangeRate = (data.compra + data.venta) / 2;
                console.log('Exchange rate from backup API:', exchangeRate);
            } catch (backupError) {
                console.error('Backup exchange rate API also failed:', backupError);
                throw new Error('All exchange rate APIs failed');
            }
        }
        
        // Validate the exchange rate
        if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) {
            console.error('Invalid exchange rate received:', exchangeRate);
            return 1200; // Fallback to a reasonable rate
        }
        
        return exchangeRate;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return 1200; // Fallback rate if all APIs fail
    }
}

// Function to convert ARS to USD using current market rate
async function arsToUSD(arsAmount) {
    const exchangeRate = await getCurrentExchangeRate();
    return arsAmount / exchangeRate;
}

// Function to format number with thousand separators
function formatNumber(number) {
    return number.toLocaleString('es-AR', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    });
}

// Function to extract surface area from property details
function extractSurfaceArea(cardElement) {
    // Guard against non-DOM elements
    if (!cardElement || typeof cardElement.getAttribute !== 'function') {
        console.warn('Invalid card element provided to extractSurfaceArea');
        return null;
    }

    const cardId = cardElement.getAttribute('data-id') || 'unknown';
    console.group('Surface area detection for card:', cardId);

    const attempts = [
        // Attempt 1: Direct surface feature with data-qa attribute
        () => {
            console.log('Attempt 1: Checking direct surface feature...');
            const selectors = [
                '[data-qa="posting-card-feature-surface"]',
                '[data-qa="surface"]',
                '[data-qa="property-features"] span:nth-child(1)',
                '[data-qa="posting-card-feature-total-surface"]'
            ];
            for (const selector of selectors) {
                const surfaceFeature = cardElement.querySelector(selector);
                if (surfaceFeature) {
                    const text = surfaceFeature.textContent.trim();
                    if (text.includes('m²')) {
                        console.log(`✓ Found surface via selector "${selector}":`, text);
                        return text;
                    }
                }
            }
            return null;
        },
        // Attempt 2: Features container
        () => {
            console.log('Attempt 2: Checking features container...');
            const selectors = [
                '.postingFeatures-module__features',
                '.postingCard-features',
                '.property-features',
                '.features-container',
                '.posting-features-wrapper',
                '.features'
            ];
            for (const selector of selectors) {
                const featuresContainer = cardElement.querySelector(selector);
                if (featuresContainer) {
                    const text = featuresContainer.textContent.trim();
                    if (text.includes('m²')) {
                        console.log(`✓ Found surface in features container "${selector}":`, text);
                        return text;
                    }
                }
            }
            return null;
        },
        // Attempt 3: Individual feature elements
        () => {
            console.log('Attempt 3: Checking individual features...');
            const selectors = [
                '[data-qa="posting-card-features-features"]',
                '[data-qa="features"]',
                '.postingCard-features-item',
                '.feature-item',
                '.feature-value',
                '.posting-features span'
            ];
            for (const selector of selectors) {
                const features = Array.from(cardElement.querySelectorAll(selector));
                console.log(`Found ${features.length} features with selector "${selector}"`);
                for (const feature of features) {
                    const text = feature.textContent.trim();
                    if (text.includes('m²')) {
                        console.log(`✓ Found surface in feature:`, text);
                        return text;
                    }
                }
            }
            return null;
        },
        // Attempt 4: Search in specific feature divs
        () => {
            console.log('Attempt 4: Checking generic feature divs...');
            const features = Array.from(cardElement.querySelectorAll([
                'div[class*="feature"]',
                'div[class*="Feature"]',
                '.posting-features',
                'div[class*="surface"]',
                'div[class*="Surface"]',
                '.features div'
            ].join(',')));
            console.log(`Found ${features.length} potential feature divs`);
            for (const feature of features) {
                const text = feature.textContent.trim();
                if (text.includes('m²')) {
                    console.log(`✓ Found surface in div:`, text);
                    return text;
                }
            }
            return null;
        },
        // Attempt 5: Last resort - search all spans and divs
        () => {
            console.log('Attempt 5: Searching all relevant text...');
            const textElements = Array.from(cardElement.querySelectorAll('span, div'));
            let allText = '';
            textElements.forEach(element => {
                const text = element.textContent.trim();
                if (text) allText += ' ' + text;
            });
            const surfaceMatch = allText.match(/(\d+(?:[.,]\d+)?)\s*m²/);
            if (surfaceMatch) {
                console.log(`✓ Found surface in combined text:`, surfaceMatch[0]);
                return surfaceMatch[0];
            }
            return null;
        }
    ];

    for (const attempt of attempts) {
        const result = attempt();
        if (result) {
            console.log('Successfully found surface area:', result);
            console.groupEnd();
            return result;
        }
    }

    // Log failure with detailed card information
    const attributes = cardElement.attributes ? Array.from(cardElement.attributes) : [];
    console.warn('Surface area detection failed. Card details:', {
        id: cardId,
        classes: cardElement.className,
        dataAttributes: attributes
            .filter(attr => attr && attr.name && attr.name.startsWith('data-'))
            .reduce((obj, attr) => ({ ...obj, [attr.name]: attr.value }), {}),
        featureElements: Array.from(cardElement.querySelectorAll('[class*="feature"], [class*="Feature"], [data-qa*="feature"]'))
            .map(el => ({ 
                class: el.className,
                text: el.textContent.trim(),
                dataQa: el.getAttribute('data-qa')
            }))
    });
    console.groupEnd();
    return null;
}

// Main function to process property cards
async function processPropertyCards() {
    console.log('Processing property cards...');

    // Try multiple selectors for property cards
    const selectors = [
        '.postingCardLayout-module__posting-card-layout',
        '.postingCard',
        '[data-qa="posting-card"]',
        '.property-card',
        '.posting'
    ];
    
    let propertyCards = [];
    
    for (const selector of selectors) {
        const cards = document.querySelectorAll(selector);
        if (cards.length > 0) {
            console.log(`Found ${cards.length} property cards with selector "${selector}"`);
            propertyCards = cards;
            break;
        }
    }
    
    if (propertyCards.length === 0) {
        console.log('No property cards found with any selector');
        return;
    }

    for (const card of propertyCards) {
        try {
            // Skip if already processed
            if (card.querySelector('.price-per-meter')) continue;

            // Try multiple price element selectors
            const priceSelectors = [
                '[data-qa="price"]',
                '[data-qa="posting-price"]',
                '[data-qa="posting-card-price"]',
                '.price',
                '.postingCard-price',
                '.posting-price',
                '.firstPrice',
                '.value',
                '[class*="price"]',
                '[class*="Price"]'
            ];
            
            let priceElement = null;
            
            // First attempt: Direct selectors
            for (const selector of priceSelectors) {
                const elements = card.querySelectorAll(selector);
                for (const element of elements) {
                    const text = element.textContent.trim();
                    if (text && (text.includes('USD') || text.includes('U$S') || text.includes('ARS') || 
                        text.includes('$')) && /\d+/.test(text)) {
                        priceElement = element;
                        console.log(`Found price element with selector "${selector}": "${text}"`);
                        break;
                    }
                }
                if (priceElement) break;
            }
            
            // Second attempt: Find any element containing price information
            if (!priceElement) {
                console.log('Trying broader search for price elements...');
                const currencyMatchers = ['USD', 'U$S', 'U$D', 'ARS', '$'];
                
                // First look for elements specifically containing both numbers and currency indicators
                const allElements = Array.from(card.querySelectorAll('div, span, p, h1, h2, h3, h4'));
                for (const element of allElements) {
                    const text = element.textContent.trim();
                    // Check if text contains both a currency indicator and a number
                    if (text && /\d+/.test(text) && 
                        currencyMatchers.some(currency => text.includes(currency))) {
                        priceElement = element;
                        console.log(`Found price using text content scan: "${text}"`);
                        break;
                    }
                }
            }
            
            if (!priceElement) {
                // Log detailed information for debugging
                console.log('Price element not found in card. Details:', {
                    cardId: card.getAttribute('data-id') || 'unknown',
                    classes: card.className,
                    possiblePriceTexts: Array.from(card.querySelectorAll('*'))
                        .map(el => el.textContent.trim())
                        .filter(text => /\d+/.test(text) && text.length < 30)
                        .slice(0, 5)
                });
                continue;
            }

            // Get surface area
            const surfaceText = extractSurfaceArea(card);
            if (!surfaceText) {
                console.log('Surface area not found for card');
                continue;
            }

            // Extract surface area value
            const surfaceMatch = surfaceText.match(/(\d+(?:[.,]\d+)?)\s*m²/);
            if (!surfaceMatch) {
                console.log('Could not parse surface area from:', surfaceText);
                continue;
            }

            // Extract and convert price
            let price;
            try {
                price = extractNumber(priceElement.textContent);
                if (isNaN(price) || price <= 0) {
                    console.log('Invalid price extracted:', priceElement.textContent);
                    continue;
                }
                
                if (!isUSD(priceElement)) {
                    price = await arsToUSD(price);
                }
            } catch (error) {
                console.error('Error extracting price:', error);
                continue;
            }

            // Calculate surface area
            const surface = extractNumber(surfaceMatch[1]);
            if (!surface || isNaN(surface) || surface <= 0) {
                console.log('Invalid surface area:', surfaceMatch[1]);
                continue;
            }

            // Calculate and format price per m²
            const pricePerMeter = price / surface;
            if (isNaN(pricePerMeter) || pricePerMeter <= 0) {
                console.log('Invalid price per meter calculation');
                continue;
            }
            
            console.log(`Calculated ${formatNumber(pricePerMeter)} USD/m² for surface ${surface}m²`);

            // Create and style price per meter element
            const pricePerMeterElement = document.createElement('span');
            pricePerMeterElement.textContent = `(USD ${formatNumber(pricePerMeter)}/m²)`;
            pricePerMeterElement.style.color = '#28a745';
            pricePerMeterElement.style.fontWeight = 'bold';
            pricePerMeterElement.style.marginLeft = '10px';
            pricePerMeterElement.style.fontSize = '0.9em';
            pricePerMeterElement.className = 'price-per-meter';

            priceElement.appendChild(pricePerMeterElement);

        } catch (error) {
            console.error('Error processing property card:', error);
        }
    }
}

// Only run in browser environment
if (typeof window !== 'undefined') {
    // Initial processing
    processPropertyCards();

    // Set up a MutationObserver to handle dynamically loaded content
    const observer = new MutationObserver(() => {
        processPropertyCards();
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Zonaprop Price per m² extension loaded successfully');
}

// Export functions for testing
if (typeof module !== 'undefined') {
    module.exports = {
        extractNumber,
        isUSD,
        formatNumber,
        getCurrentExchangeRate,
        arsToUSD,
        extractSurfaceArea
    };
}