// Function to extract numbers from string and remove dots
function extractNumber(str) {
    return parseFloat(str.replace(/\./g, '').match(/\d+/g)[0]);
}

// Function to check if price is in USD or ARS
function isUSD(priceElement) {
    return priceElement.textContent.includes('USD');
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

    // Try multiple possible selectors for property cards
    const propertyCards = document.querySelectorAll([
        '[data-qa="posting PROPERTY"]',
        '.postingCard',
        '.listing-item',
        '[data-posting-type="PROPERTY"]'
    ].join(','));

    console.log(`Found ${propertyCards.length} property cards`);

    for (const card of propertyCards) {
        try {
            // Try multiple possible selectors for price
            const priceElement = card.querySelector([
                '[data-qa="POSTING_CARD_PRICE"]',
                '.firstPrice',
                '.price-items',
                '.posting-price'
            ].join(','));

            if (!priceElement) {
                console.log('Price element not found for card:', card);
                continue;
            }

            // Try multiple possible selectors for surface
            const surfaceElement = card.querySelector([
                '[data-qa="POSTING_CARD_SURFACE"]',
                '.surface',
                '.posting-features',
                '.total-area'
            ].join(','));

            if (!surfaceElement) {
                console.log('Surface element not found for card:', card);
                continue;
            }

            // Check if price per meter is already added
            if (priceElement.querySelector('.price-per-meter')) continue;

            console.log('Processing card with price:', priceElement.textContent, 'and surface:', surfaceElement.textContent);

            // Extract and process price
            let price = extractNumber(priceElement.textContent);
            if (!isUSD(priceElement)) {
                price = await arsToUSD(price);
            }

            // Extract surface (m²)
            const surface = extractNumber(surfaceElement.textContent);

            // Calculate price per m²
            const pricePerMeter = price / surface;

            console.log('Calculated price per meter:', pricePerMeter);

            // Create and style the new price per m² element
            const pricePerMeterElement = document.createElement('span');
            pricePerMeterElement.textContent = `(USD ${formatNumber(pricePerMeter)}/m²)`;
            pricePerMeterElement.style.color = '#28a745';
            pricePerMeterElement.style.fontWeight = 'bold';
            pricePerMeterElement.style.marginLeft = '10px';
            pricePerMeterElement.style.fontSize = '0.9em';
            pricePerMeterElement.className = 'price-per-meter';

            // Insert the new element after the price
            priceElement.appendChild(pricePerMeterElement);

        } catch (error) {
            console.error('Error processing property card:', error);
        }
    }
}

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