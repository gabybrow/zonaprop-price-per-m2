// Function to extract numbers from string and remove dots
function extractNumber(str) {
    // Handle decimal numbers with comma
    if (str.includes(',')) {
        return parseFloat(str.replace(/\./g, '').replace(',', '.'));
    }
    return parseFloat(str.replace(/\./g, '').match(/\d+/g)[0]);
}

// Function to check if price is in USD or ARS
function isUSD(priceElement) {
    const text = priceElement.textContent.toUpperCase();
    return text.includes('USD') || text.includes('U$S');
}

// Function to fetch current exchange rate
async function getCurrentExchangeRate() {
    try {
        const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await response.json();
        // Using blue rate (informal market rate) as it's closer to dolarhoy.com values
        return (data.blue.value_buy + data.blue.value_sell) / 2;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return 1200; // Fallback rate if API fails
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
    console.group('Surface area detection for card:', cardElement.getAttribute('data-id'));

    const attempts = [
        // Attempt 1: Direct surface feature with data-qa attribute
        () => {
            console.log('Attempt 1: Checking direct surface feature...');
            const selectors = [
                '[data-qa="posting-card-feature-surface"]',
                '[data-qa="surface"]',
                '[data-qa="property-features"] span:nth-child(1)',
                '[data-qa="posting-card-feature-total-surface"]'  // Added new selector
            ];
            for (const selector of selectors) {
                const surfaceFeature = cardElement.querySelector(selector);
                if (surfaceFeature) {
                    const text = surfaceFeature.textContent.trim();
                    console.log(`Found surface via selector "${selector}":`, text);
                    if (text.includes('m²')) return text;
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
                '.posting-features-wrapper'  // Added new selector
            ];
            for (const selector of selectors) {
                const featuresContainer = cardElement.querySelector(selector);
                if (featuresContainer) {
                    const text = featuresContainer.textContent.trim();
                    console.log(`Found features container with selector "${selector}":`, text);
                    if (text.includes('m²')) return text;
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
                '.feature-value'  // Added new selector
            ];
            for (const selector of selectors) {
                const features = Array.from(cardElement.querySelectorAll(selector));
                console.log(`Found ${features.length} features with selector "${selector}"`);
                for (const feature of features) {
                    const text = feature.textContent.trim();
                    if (text.includes('m²')) {
                        console.log('Found surface in feature:', text);
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
                'div[class*="surface"]',  // Added new selector
                'div[class*="Surface"]'   // Added new selector
            ].join(',')));
            console.log(`Found ${features.length} potential feature divs`);
            for (const feature of features) {
                const text = feature.textContent.trim();
                if (text.includes('m²')) {
                    console.log('Found surface in div:', text);
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
            console.log('Combined text content:', allText);
            const surfaceMatch = allText.match(/(\d+(?:[.,]\d+)?)\s*m²/);
            if (surfaceMatch) {
                console.log('Found surface in combined text:', surfaceMatch[0]);
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
    console.warn('Surface area detection failed. Card details:', {
        id: cardElement.getAttribute('data-id'),
        classes: cardElement.className,
        dataAttributes: Array.from(cardElement.attributes)
            .filter(attr => attr.name.startsWith('data-'))
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

    // Select property cards using the specific module class
    const propertyCards = document.querySelectorAll('.postingCardLayout-module__posting-card-layout');
    console.log(`Found ${propertyCards.length} property cards`);

    for (const card of propertyCards) {
        try {
            // Skip if already processed
            if (card.querySelector('.price-per-meter')) continue;

            // Price element selector
            const priceElement = card.querySelector('[data-qa="price"]');
            if (!priceElement) {
                console.log('Price element not found in card:', card.outerHTML);
                continue;
            }

            // Get surface area
            const surfaceText = extractSurfaceArea(card);
            if (!surfaceText) continue;

            // Extract surface area value
            const surfaceMatch = surfaceText.match(/(\d+(?:[.,]\d+)?)\s*m²/);
            if (!surfaceMatch) {
                console.log('Could not parse surface area from:', surfaceText);
                continue;
            }

            // Extract and convert price
            let price = extractNumber(priceElement.textContent);
            if (!isUSD(priceElement)) {
                price = await arsToUSD(price);
            }

            // Calculate surface area
            const surface = extractNumber(surfaceMatch[1]);
            if (!surface) {
                console.log('Invalid surface area:', surfaceMatch[1]);
                continue;
            }

            // Calculate and format price per m²
            const pricePerMeter = price / surface;
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
            console.log('Problematic card HTML:', card.outerHTML);
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