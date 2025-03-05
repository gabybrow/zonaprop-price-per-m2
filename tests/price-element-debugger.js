
// Price Element Debugger
// Run this in the browser console on Zonaprop to debug price elements

function debugPriceElements() {
    console.group('Price Element Debugging');
    
    // Try multiple selectors for property cards
    const cardSelectors = [
        '.postingCardLayout-module__posting-card-layout',
        '.postingCard',
        '[data-qa="posting-card"]',
        '.property-card',
        '.posting'
    ];
    
    let propertyCards = [];
    
    for (const selector of cardSelectors) {
        const cards = document.querySelectorAll(selector);
        if (cards.length > 0) {
            console.log(`Found ${cards.length} property cards with selector "${selector}"`);
            propertyCards = Array.from(cards);
            break;
        }
    }
    
    if (propertyCards.length === 0) {
        console.log('No property cards found with any selector');
        return;
    }

    // Check each card for price elements
    propertyCards.forEach((card, index) => {
        console.group(`Card #${index + 1}`);
        
        // Try standard price selectors
        const priceSelectors = [
            '[data-qa="price"]',
            '.price',
            '.postingCard-price',
            '.posting-price',
            '.firstPrice',
            '.value'
        ];
        
        let foundPrice = false;
        
        for (const selector of priceSelectors) {
            const priceElement = card.querySelector(selector);
            if (priceElement) {
                console.log(`✅ Found price with selector "${selector}": "${priceElement.textContent.trim()}"`);
                foundPrice = true;
            }
        }
        
        if (!foundPrice) {
            console.log('❌ No price element found with standard selectors');
            
            // Find any element that contains price text
            const allElements = card.querySelectorAll('*');
            let potentialPriceElements = [];
            
            allElements.forEach(el => {
                const text = el.textContent.trim();
                if ((text.includes('USD') || text.includes('U$S') || text.includes('ARS')) && 
                    /\d+/.test(text)) {
                    potentialPriceElements.push({
                        element: el,
                        text: text,
                        tagName: el.tagName,
                        classes: el.className,
                        id: el.id,
                        path: getElementPath(el)
                    });
                }
            });
            
            if (potentialPriceElements.length > 0) {
                console.log('📋 Potential price elements found:');
                potentialPriceElements.forEach((item, i) => {
                    console.log(`  ${i + 1}. ${item.text} [${item.tagName}]`);
                    console.log(`     Classes: ${item.classes || 'none'}`);
                    console.log(`     Path: ${item.path}`);
                });
            } else {
                console.log('⚠️ No potential price elements found in this card');
                console.log('Card HTML (first 300 chars):', card.outerHTML.substring(0, 300));
            }
        }
        
        console.groupEnd();
    });
    
    console.groupEnd();
}

// Helper function to get an element's CSS path
function getElementPath(element) {
    if (!element) return '';
    
    const path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
        let selector = element.nodeName.toLowerCase();
        
        if (element.id) {
            selector += `#${element.id}`;
            path.unshift(selector);
            break;
        } else {
            let sibling = element;
            let siblingIndex = 1;
            
            while (sibling.previousElementSibling) {
                sibling = sibling.previousElementSibling;
                siblingIndex += 1;
            }
            
            selector += `:nth-child(${siblingIndex})`;
        }
        
        path.unshift(selector);
        element = element.parentNode;
    }
    
    return path.join(' > ');
}

// Run the debugger
debugPriceElements();
