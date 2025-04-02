# Sanvivo Pricing Tool

A real-time price comparison tool for medical cannabis products. This tool fetches current prices from the DrAnsay API and displays them in a clean, sortable interface.

## Features

- Real-time price data from multiple pharmacies
- Display of product names (Sorte), cultivars, pharmacy IDs, and prices
- Automatic price sorting
- CSV export functionality
- Clean and professional interface

## Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

## Installation

1. Clone this repository or download the files to your local machine.

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the root directory and add your API key:
   ```
   DRANSAY_API_KEY="your_api_key_here"
   ```

## Usage

1. Make sure your virtual environment is activated.

2. Start the application:
   ```bash
   streamlit run app.py
   ```

3. The application will open in your default web browser.

4. Click "Fetch Prices" to get the current price data.

5. Use the "Download CSV" button to export the data if needed.

## Data Display

The tool displays the following information for each product:
- **Sorte**: Product name/strain
- **Kultivar**: Cultivar name
- **Pharmacy ID**: Identifier of the pharmacy offering the lowest price
- **Price (€/g)**: Lowest price per gram in euros

## Notes

- Prices are automatically sorted from lowest to highest
- The tool only displays products with valid pricing information
- All prices are shown in euros per gram
- The data is fetched in real-time when clicking the "Fetch Prices" button

## Security

- Keep your API key secure and never commit the `.env` file to version control
- The `.gitignore` file is configured to exclude the `.env` file

## Support

For support or questions, please contact the Sanvivo team. 