import os
import requests
import pandas as pd
from dotenv import load_dotenv
from api.database.db_handler import get_most_recent_data_before, get_data_by_timestamp, get_all_timestamps

# Load environment variables from .env file
load_dotenv()

# API configuration
API_ENDPOINT = "https://europe-west3-au-digital.cloudfunctions.net/dransay/api/webshop/products?sandbox=0"
API_KEY = os.getenv("DRANSAY_API_KEY")
HEADERS = {"x-api-key": API_KEY}

def fetch_product_data():
    """Fetches product data from the DrAnsay API and processes it."""
    if not API_KEY:
        raise ValueError("API key not found. Please ensure it's set in the .env file.")

    try:
        response = requests.get(API_ENDPOINT, headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        products_list = data if isinstance(data, list) else data.get('products', [])
        if not products_list:
            return pd.DataFrame(columns=["Sorte", "Kultivar", "Pharmacy ID", "Price (€/g)"])

        extracted_data = []
        for product in products_list:
            product_name = product.get('sorte')
            if not product_name:  # Skip products without a name
                continue

            kultivar = product.get('kultivar', '')  # Get kultivar, empty string if not present
            vendors = product.get('vendors', {})
            cheapest_price = float('inf')
            cheapest_vendor = None

            # Find the cheapest vendor
            for vendor_id, vendor_data in vendors.items():
                price_cents = vendor_data.get('price')
                if price_cents is not None:
                    try:
                        price_euros = float(price_cents) / 100.0
                        if price_euros < cheapest_price:
                            cheapest_price = price_euros
                            cheapest_vendor = vendor_id
                    except (ValueError, TypeError):
                        continue

            # If we found a valid price and vendor, add to results
            if cheapest_vendor is not None:
                extracted_data.append({
                    "Sorte": product_name,
                    "Kultivar": kultivar,
                    "Pharmacy ID": cheapest_vendor,
                    "Price (€/g)": cheapest_price
                })

        if not extracted_data:
            return pd.DataFrame(columns=["Sorte", "Kultivar", "Pharmacy ID", "Price (€/g)"])

        df = pd.DataFrame(extracted_data)
        return df.sort_values(by="Price (€/g)").reset_index(drop=True)

    except requests.exceptions.RequestException as e:
        raise Exception(f"Error fetching data from API: {e}")
    except ValueError as e:
        raise Exception(f"Error parsing JSON response: {e}")
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")

def add_trend_analysis(current_df, timestamp=None):
    """Add trend analysis by comparing with the previous dataset."""
    if current_df is None or current_df.empty:
        return current_df
    
    # Make a copy to avoid modifying the original
    df = current_df.copy()
    
    # Replace Sanvivo's ID with its name
    df["Pharmacy ID"] = df["Pharmacy ID"].apply(lambda x: "Sanvivo" if x == "8I6qNL3zUifl8peYH9Tu1TcOXSt1" else x)
    
    # Get previous data
    prev_timestamp = None
    prev_df = None
    
    if timestamp:
        # If we have a specific timestamp, get the data right before it
        prev_timestamp, prev_df = get_most_recent_data_before(timestamp)
        print(f"Using previous data from {prev_timestamp} to compare with {timestamp}")
    else:
        # If no timestamp provided, get the most recent data in the DB
        timestamps = get_all_timestamps()
        if timestamps:  # Make sure there's at least one timestamp
            # Current data hasn't been saved yet, so compare with the most recent
            prev_timestamp = timestamps[0]
            prev_df = get_data_by_timestamp(prev_timestamp)
            print(f"Using most recent data from {prev_timestamp} for comparison")
    
    # If no previous data found, return dataframe without trend
    if prev_df is None or prev_df.empty:
        print("No previous data found for comparison, marking all as 'First data point'")
        df["Trend"] = "First data point"
        return df
    
    # Initialize trend column
    df["Trend"] = ""
    
    # Track statistics for debugging
    unchanged_count = 0
    increased_count = 0
    decreased_count = 0
    new_count = 0
    
    # Compare prices for each product
    for idx, row in df.iterrows():
        product_name = row["Sorte"]
        current_price = row["Price (€/g)"]
        
        # Find this product in previous data
        prev_product = prev_df[prev_df["Sorte"] == product_name]
        
        if not prev_product.empty:
            prev_price = prev_product.iloc[0]["Price (€/g)"]
            
            # Calculate price difference with 2 decimal precision
            price_diff = round(current_price - prev_price, 2)
            
            # Determine trend with threshold of 0.01 to account for minor calculation differences
            if abs(price_diff) < 0.01:  # Price unchanged (within 1 cent)
                df.at[idx, "Trend"] = "→ Unchanged"
                unchanged_count += 1
            elif price_diff > 0:  # Price increased
                df.at[idx, "Trend"] = f"↑ +{price_diff:.2f}€"
                increased_count += 1
            else:  # Price decreased
                df.at[idx, "Trend"] = f"↓ {price_diff:.2f}€"
                decreased_count += 1
        else:
            # Product not in previous data
            df.at[idx, "Trend"] = "New product"
            new_count += 1
    
    # Print summary statistics
    print(f"Trend analysis complete: {unchanged_count} unchanged, {increased_count} increased, {decreased_count} decreased, {new_count} new products")
    
    return df 