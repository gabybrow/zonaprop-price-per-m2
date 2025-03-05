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

// Main function to process property cards
async function processPropertyCards() {
    console.log('Processing property cards...');

    // Updated selectors for property cards to match the new structure
    const propertyCards = document.querySelectorAll('.postingCardLayout-module__posting-card-layout');

    console.log(`Found ${propertyCards.length} property cards`);

    for (const card of propertyCards) {
        try {
            // Updated selectors for price elements
            const priceElement = card.querySelector([
                '[data-qa="price"]',
                '[data-qa="POSTING_CARD_PRICE"]',
                '.firstPrice',
                '.price-items',
                '.price'
            ].join(','));

            if (!priceElement) {
                console.log('Price element not found for card:', card.outerHTML.slice(0, 200));
                continue;
            }

            // Get all feature elements and combine their text
            const featureElements = card.querySelectorAll([
                'span[data-qa="posting-card-features-features"]',
                'div[data-qa="posting-card-features"]',
                'div.postingFeatures-module__features',
                'div.features'
            ].join(','));

            let surfaceText = '';
            featureElements.forEach(element => {
                console.log('Feature element found:', element.textContent);
                surfaceText += ' ' + element.textContent;
            });

            if (!surfaceText) {
                console.log('Surface elements not found. Card HTML:', card.outerHTML.slice(0, 200));
                continue;
            }

            // Check if we already processed this card
            if (priceElement.querySelector('.price-per-meter')) continue;

            console.log('Processing card with price:', priceElement.textContent, 'and features:', surfaceText);

            // Extract price and convert if necessary
            let price = extractNumber(priceElement.textContent);
            if (!isUSD(priceElement)) {
                price = await arsToUSD(price);
            }

            // Find the surface area within the features text
            // Updated regex to handle more variations of surface area format
            console.log('Analyzing surface text:', surfaceText);

            const surfaceMatch = surfaceText.match(/(\d+(?:[.,]\d+)?)\s*m²|(\d+(?:[.,]\d+)?)\s*metros?\s*cuadrados?/i);
            if (!surfaceMatch) {
                console.log('Could not find surface area in features:', surfaceText);
                continue;
            }

            const surfaceStr = surfaceMatch[1] || surfaceMatch[2];
            const surface = extractNumber(surfaceStr);
            if (!surface) {
                console.log('Invalid surface area:', surfaceStr);
                continue;
            }

            // Calculate and display price per m²
            const pricePerMeter = price / surface;
            console.log('Calculated price per meter:', pricePerMeter);

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
            console.log('Problematic card HTML:', card.outerHTML.slice(0, 200));
        }
    }
}

// Only run in browser environment
if (typeof window !== 'undefined') {
    // Initial processing
    processPropertyCards();

    // Set up a MutationObserver to handle dynamically loaded content
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                processPropertyCards();
            }
        }
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Add console message to verify the script is loaded
    console.log('Zonaprop Price per m² extension loaded successfully');
}

// Export functions for testing (only in Node.js environment)
if (typeof module !== 'undefined') {
    module.exports = {
        extractNumber,
        isUSD,
        formatNumber,
        getCurrentExchangeRate,
        arsToUSD
    };
}