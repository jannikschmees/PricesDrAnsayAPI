# Sanvivo Pricing Tool

A real-time price comparison tool for medical cannabis products. This tool fetches current prices from the DrAnsay API and displays them in a clean, modern interface.

## Features

- Real-time price data from multiple pharmacies
- Display of product names (Sorte), cultivars, pharmacy IDs, and prices
- Price trend analysis showing changes between measurements
- Filter options:
  - Show only products with price changes
  - Hide products where Sanvivo offers the lowest price
- Automatic price sorting
- CSV export functionality
- Historical data storage with SQLite database
- Clean and professional interface
- Modern React-based UI

## Tech Stack

- Backend: FastAPI (Python)
- Frontend: React with Material-UI
- Database: SQLite
- API Integration: DrAnsay API

## Prerequisites

- Python 3.7 or higher
- Node.js 14 or higher
- npm (Node package manager)
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

4. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the root directory and add your API key:
   ```
   DRANSAY_API_KEY="your_api_key_here"
   ```

6. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Usage

1. Make sure your virtual environment is activated.

2. Start the backend server:
   ```bash
   python server.py
   ```

3. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   npm start
   ```

4. The application will open in your default web browser at http://localhost:3000.

5. Click "Fetch Current Prices" to get the current price data. This will also save the data to the SQLite database.

6. Use the dropdown menu to select and load historical data from previous fetches.

7. Use the filter options to customize your view:
   - Check "Show only price changes" to filter the display to show only products with changed prices.
   - Check "Hide Sanvivo best prices" to show only products where Sanvivo is not offering the lowest price.

8. Use the "Export CSV" button to export the currently displayed data if needed.

## Data Display

The tool displays the following information for each product:
- **Sorte**: Product name/strain
- **Kultivar**: Cultivar name
- **Pharmacy ID**: Identifier of the pharmacy offering the lowest price (displays "Sanvivo" for Sanvivo's ID)
- **Price (€/g)**: Lowest price per gram in euros
- **Trend**: Price change compared to the previous measurement, shown with directional arrows and the exact change amount

## Trend Analysis

The tool automatically compares current prices with the most recent previous measurement to show:
- Price increases: Shown with an up arrow and the exact amount of increase
- Price decreases: Shown with a down arrow and the exact amount of decrease
- Unchanged prices: Shown with a horizontal arrow
- New products: Products that weren't in the previous measurement
- First data point: When there's no previous data for comparison

The "Show only price changes" filter lets you focus on products that have price increases, decreases, or are new to the dataset, hiding products with unchanged prices.

## Pharmacy Filters

The "Hide Sanvivo best prices" filter allows you to focus only on products where Sanvivo is not the pharmacy offering the lowest price. This is useful for identifying competitive pricing opportunities or products where other pharmacies are more competitive.

## Database

The application uses SQLite to store:
- Timestamps of when data was fetched
- Complete dataset from each fetch

This allows for historical comparison and tracking of price changes over time.

## API Endpoints

- `GET /api/prices/current`: Fetch current prices from the DrAnsay API
- `GET /api/prices/timestamps`: Get all available timestamps from the database
- `GET /api/prices/historical/{timestamp}`: Get historical prices from a specific timestamp

## Notes

- Prices are automatically sorted from lowest to highest
- The tool only displays products with valid pricing information
- All prices are shown in euros per gram
- The data is fetched in real-time when clicking the "Fetch Current Prices" button
- The SQLite database file (sanvivo_prices.db) is created automatically

## Security

- Keep your API key secure and never commit the `.env` file to version control
- The `.gitignore` file is configured to exclude the `.env` file

## Development

### Backend (FastAPI)
- API routes are defined in `api/main.py`
- Database functions are in `api/database/db_handler.py`
- Data fetching and processing functions are in `api/utils/data_fetcher.py`

### Frontend (React)
- Components are in the `frontend/src/components` directory
- API service functions are in `frontend/src/services/api.js`

## Support

For support or questions, please contact the Sanvivo team. 