# How to Start the Sanvivo Pricing Tool

The Sanvivo Pricing Tool now uses a modern architecture with a FastAPI backend and React frontend. Follow these steps to run the application:

## Option 1: Using the run.sh script (recommended)

1. Make sure you have Python 3.7+ and Node.js installed
2. Open a terminal and navigate to the project directory
3. Run the following command:
   ```bash
   ./run.sh
   ```
   This script will:
   - Create a virtual environment if needed
   - Install Python dependencies
   - Install frontend dependencies if needed
   - Start both the backend and frontend

## Option 2: Manual startup

### Start the backend

1. Open a terminal and navigate to the project directory
2. Create and activate a virtual environment (if not already done):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   python server.py
   ```
   The API will be available at http://localhost:8000

### Start the frontend

1. Open another terminal and navigate to the project directory
2. Go to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies (if not already done):
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm start
   ```
   The app will open in your browser at http://localhost:3000

## Using the application

1. The application will open in your default web browser.
2. Click "Fetch Current Prices" to get the latest data.
3. Use the dropdown to load historical data or the filter options to customize your view.

## Troubleshooting

- If you see errors about missing packages, make sure to install all dependencies:
  ```bash
  pip install -r requirements.txt
  cd frontend && npm install
  ```
- If the API doesn't respond, check that the backend server is running at http://localhost:8000 