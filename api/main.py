from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import List, Optional
import datetime
import json

from api.database.db_handler import init_db, save_to_db, get_all_timestamps, get_data_by_timestamp, get_most_recent_data_before, get_pharmacy_price_history
from api.utils.data_fetcher import fetch_product_data, add_trend_analysis, fetch_and_analyze_all_pharmacy_prices

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

@app.get("/api/prices/best-competitor")
async def get_best_competitor_prices():
    """Get the latest prices with focus on best competitor prices"""
    try:
        df = fetch_product_data()
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Failed to fetch prices from API")
        
        # Add trend analysis
        df_with_trend = add_trend_analysis(df)
        
        # Filter data to show only products where Sanvivo isn't the cheapest or where competitor price exists
        filtered_df = df_with_trend[df_with_trend["Best Competitor"].notna()]
        
        # Convert DataFrame to list of dictionaries
        result = filtered_df.to_dict(orient="records")
        
        # Return the data along with metadata
        return {
            "data": result,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "filter_applied": "best_competitor_only"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/prices/pharmacy-history")
async def get_pharmacy_history(
    product_id: Optional[str] = None,
    pharmacy_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get price history for specific pharmacies and products
    
    Parameters:
    - product_id: Filter by product ID
    - pharmacy_id: Filter by pharmacy ID
    - start_date: Filter by start date (format: YYYY-MM-DD HH:MM:SS)
    - end_date: Filter by end date (format: YYYY-MM-DD HH:MM:SS)
    """
    try:
        df = get_pharmacy_price_history(product_id, pharmacy_id, start_date, end_date)
        
        if df.empty:
            return {
                "data": [],
                "message": "No pharmacy history data found matching the criteria"
            }
        
        # Convert DataFrame to list of dictionaries
        result = df.to_dict(orient="records")
        
        return {
            "data": result,
            "count": len(result),
            "filters_applied": {
                "product_id": product_id,
                "pharmacy_id": pharmacy_id,
                "start_date": start_date,
                "end_date": end_date
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving pharmacy history data: {str(e)}")

@app.get("/api/prices/pharmacy-history/refresh")
async def refresh_pharmacy_history():
    """
    Manually trigger a refresh of pharmacy price history data
    """
    try:
        df = fetch_and_analyze_all_pharmacy_prices()
        
        if df.empty:
            return {
                "success": False,
                "message": "Failed to fetch or save pharmacy prices"
            }
        
        return {
            "success": True,
            "message": f"Successfully saved {len(df)} pharmacy price points",
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing pharmacy history data: {str(e)}") 