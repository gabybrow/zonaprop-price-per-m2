# Zonaprop Price per m² Chrome Extension

This Chrome extension adds price per square meter calculations to Zonaprop property listings.

## Screenshots

![Price Calculation Example](screenshots/price-calculation.png)

*Above: Example of price per square meter calculation displayed next to a property listing*

## Installation Instructions

1. Download all files in this folder:
   - manifest.json
   - content.js
   - icon.svg

2. Create a new folder on your computer named "zonaprop-price-per-m2"

3. Place all downloaded files into this folder

4. Open Google Chrome and go to `chrome://extensions/`

5. Enable "Developer mode" by clicking the toggle switch in the top-right corner

6. Click "Load unpacked" button

7. Select the "zonaprop-price-per-m2" folder you created

8. The extension should now appear in your extensions list with a green $/m² icon

## Usage

1. Visit any property listing page on zonaprop.com.ar
2. The extension will automatically calculate and display the price per square meter in green text next to each property's price
3. Prices in ARS will be automatically converted to USD using current market rates

## Features

- Automatic conversion of ARS prices to USD using real-time exchange rates
- Dynamic updates as you scroll through property listings
- Clear, green-colored display of price per square meter
- Works with both rental and sale listings

## Development

### Running Tests

The project uses Jest for testing. To run the tests:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

### Test Coverage

The test suite covers:
- Price extraction from strings
- Currency detection (USD/ARS)
- Number formatting
- Exchange rate fetching
- ARS to USD conversion

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request