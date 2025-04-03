from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import List, Optional
import datetime
import json

from api.database.db_handler import init_db, save_to_db, get_all_timestamps, get_data_by_timestamp, get_most_recent_data_before
from api.utils.data_fetcher import fetch_product_data, add_trend_analysis

# Initialize the FastAPI app
app = FastAPI(
    title="Sanvivo Pricing API",
    description="API for fetching and managing price data for medical cannabis products",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# API routes
@app.get("/api/prices/current")
async def get_current_prices():
    """Fetch current prices from the DrAnsay API"""
    try:
        df = fetch_product_data()
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Failed to fetch prices from API")
        
        # Add trend analysis
        df_with_trend = add_trend_analysis(df)
        
        # Save the original data (without trend) to database
        save_success = save_to_db(df)
        
        # Convert DataFrame to list of dictionaries (JSON serializable format)
        result = df_with_trend.to_dict(orient="records")
        
        # Return the data along with metadata
        return {
            "data": result,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "save_success": save_success
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/prices/timestamps")
async def get_timestamps():
    """Get all available timestamps from the database"""
    try:
        timestamps = get_all_timestamps()
        return {"timestamps": timestamps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving timestamps: {str(e)}")

@app.get("/api/prices/historical/{timestamp}")
async def get_historical_prices(timestamp: str):
    """Get historical prices from a specific timestamp"""
    try:
        df = get_data_by_timestamp(timestamp)
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Data not found for the specified timestamp")
        
        # Add trend analysis to historical data
        df_with_trend = add_trend_analysis(df, timestamp)
        
        # Convert DataFrame to list of dictionaries
        result = df_with_trend.to_dict(orient="records")
        
        return {
            "data": result,
            "timestamp": timestamp
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving historical data: {str(e)}") 