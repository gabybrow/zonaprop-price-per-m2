
// Script to check current Zonaprop website structure
// Run this in browser console on zonaprop.com.ar to debug DOM structure

function checkWebsiteStructure() {
    console.group('Zonaprop Structure Analysis');
    
    // Check for property cards
    const cardSelectors = [
        '.postingCardLayout-module__posting-card-layout',
        '.postingCard',
        '[data-qa="posting-card"]',
        '.property-card',
        '.posting'
    ];
    
    for (const selector of cardSelectors) {
        const cards = document.querySelectorAll(selector);
        console.log(`Selector "${selector}": found ${cards.length} cards`);
        
        if (cards.length > 0) {
            // Check first card structure
            const card = cards[0];
            console.log('First card:', {
                id: card.getAttribute('data-id') || 'N/A',
                classes: card.className,
                children: card.children.length
            });
            
            // Check for price elements
            const priceSelectors = [
                '[data-qa="price"]',
                '.price',
                '.postingCard-price',
                '.posting-price',
                '.firstPrice',
                '.value'
            ];
            
            for (const priceSelector of priceSelectors) {
                const priceElement = card.querySelector(priceSelector);
                console.log(`  Price selector "${priceSelector}": ${priceElement ? 'Found ✓' : 'Not found ✗'}`);
                if (priceElement) {
                    console.log(`  Price text: "${priceElement.textContent.trim()}"`);
                }
            }
            
            // Check for surface elements
            console.log('Analyzing surface area elements:');
            const surfaceText = extractSurfaceArea(card);
            console.log(`Surface area found: ${surfaceText || 'None'}`);
        }
    }
    
    console.groupEnd();
    
    return 'Analysis complete. Check console for details.';
}

// Run analysis
checkWebsiteStructure();
