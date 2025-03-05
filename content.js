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
    const attempts = [
        // Attempt 1: Direct surface feature with data-qa attribute
        () => {
            const surfaceFeature = cardElement.querySelector('[data-qa="posting-card-feature-surface"], [data-qa="surface"]');
            if (surfaceFeature) {
                console.log('Found surface via data-qa:', surfaceFeature.textContent);
                return surfaceFeature.textContent;
            }
            return null;
        },
        // Attempt 2: Features container
        () => {
            const featuresContainer = cardElement.querySelector('.postingFeatures-module__features, .postingCard-features');
            if (featuresContainer) {
                const text = featuresContainer.textContent;
                console.log('Found features container:', text);
                if (text.includes('m²')) return text;
            }
            return null;
        },
        // Attempt 3: Individual feature spans
        () => {
            const features = Array.from(cardElement.querySelectorAll('[data-qa="posting-card-features-features"], [data-qa="features"]'));
            for (const feature of features) {
                const text = feature.textContent;
                if (text.includes('m²')) {
                    console.log('Found surface in feature:', text);
                    return text;
                }
            }
            return null;
        },
        // Attempt 4: Search in specific feature divs
        () => {
            const features = Array.from(cardElement.querySelectorAll('div[class*="feature"], div[class*="Feature"]'));
            for (const feature of features) {
                const text = feature.textContent;
                if (text.includes('m²')) {
                    console.log('Found surface in div:', text);
                    return text;
                }
            }
            return null;
        }
    ];

    for (const attempt of attempts) {
        const result = attempt();
        if (result) return result;
    }

    // Log the entire card's HTML structure for debugging
    console.log('Surface area detection attempts failed. Card structure:', cardElement.outerHTML);
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