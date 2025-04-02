import streamlit as st
import requests
import pandas as pd
import os
import sqlite3
from dotenv import load_dotenv
import datetime
import json
import numpy as np

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
API_ENDPOINT = "https://europe-west3-au-digital.cloudfunctions.net/dransay/api/webshop/products?sandbox=0"
API_KEY = os.getenv("DRANSAY_API_KEY")
HEADERS = {"x-api-key": API_KEY}
DB_PATH = "sanvivo_prices.db"

# --- Database Functions ---
def init_db():
    """Initialize the SQLite database if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Create table if it doesn't exist
    c.execute('''
        CREATE TABLE IF NOT EXISTS price_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            data TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def save_to_db(df):
    """Save the DataFrame to the SQLite database with current timestamp."""
    if df is None or df.empty:
        return False
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    json_data = df.to_json(orient="records")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO price_data (timestamp, data) VALUES (?, ?)", (timestamp, json_data))
    conn.commit()
    conn.close()
    return True

def get_all_timestamps():
    """Get all timestamps from the database."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT timestamp FROM price_data ORDER BY timestamp DESC")
    timestamps = [row[0] for row in c.fetchall()]
    conn.close()
    return timestamps

def get_data_by_timestamp(timestamp):
    """Retrieve data from the database by timestamp."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT data FROM price_data WHERE timestamp = ?", (timestamp,))
    result = c.fetchone()
    conn.close()
    
    if result:
        return pd.read_json(result[0], orient="records")
    return None

def get_most_recent_data_before(current_timestamp):
    """Get the most recent data before the given timestamp."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT timestamp, data FROM price_data WHERE timestamp < ? ORDER BY timestamp DESC LIMIT 1", (current_timestamp,))
    result = c.fetchone()
    conn.close()
    
    if result:
        return result[0], pd.read_json(result[1], orient="records")
    return None, None

# --- Data Fetching and Processing ---
def fetch_product_data():
    """Fetches product data from the DrAnsay API and processes it."""
    if not API_KEY:
        st.error("API key not found. Please ensure it's set in the .env file.")
        return None

    try:
        response = requests.get(API_ENDPOINT, headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        products_list = data if isinstance(data, list) else data.get('products', [])
        if not products_list:
            st.warning("No products found in the API response.")
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
            st.warning("No products found with valid prices.")
            return pd.DataFrame(columns=["Sorte", "Kultivar", "Pharmacy ID", "Price (€/g)"])

        df = pd.DataFrame(extracted_data)
        return df.sort_values(by="Price (€/g)").reset_index(drop=True)

    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching data from API: {e}")
        return None
    except ValueError:
        st.error("Error parsing JSON response.")
        return None
    except Exception as e:
        st.error(f"An unexpected error occurred: {e}")
        return None

def add_trend_analysis(current_df, timestamp=None):
    """Add trend analysis by comparing with the previous dataset."""
    if current_df is None or current_df.empty:
        return current_df
    
    # Make a copy to avoid modifying the original
    df = current_df.copy()
    
    # Get previous data
    prev_timestamp = None
    prev_df = None
    
    if timestamp:
        # If we have a specific timestamp, get the data right before it
        prev_timestamp, prev_df = get_most_recent_data_before(timestamp)
    else:
        # If no timestamp provided, get the most recent data in the DB
        timestamps = get_all_timestamps()
        if len(timestamps) > 1:  # Need at least 2 entries
            # Current data hasn't been saved yet, so compare with the most recent
            prev_timestamp = timestamps[0]
            prev_df = get_data_by_timestamp(prev_timestamp)
    
    # If no previous data found, return dataframe without trend
    if prev_df is None or prev_df.empty:
        df["Trend"] = "First data point"
        return df
    
    # Initialize trend column
    df["Trend"] = ""
    
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
            elif price_diff > 0:  # Price increased
                df.at[idx, "Trend"] = f"↑ +{price_diff:.2f}€"
            else:  # Price decreased
                df.at[idx, "Trend"] = f"↓ {price_diff:.2f}€"
        else:
            # Product not in previous data
            df.at[idx, "Trend"] = "New product"
    
    return df

# --- Main App ---
def main():
    # Initialize database
    init_db()
    
    st.set_page_config(page_title="Sanvivo Pricing Tool", layout="wide")
    st.title("Sanvivo Pricing Tool")
    st.markdown("Real-time price comparison tool for medical cannabis products.")

    # Initialize session state for storing the dataframe with new columns
    if 'product_df' not in st.session_state:
        st.session_state.product_df = pd.DataFrame(columns=["Sorte", "Kultivar", "Pharmacy ID", "Price (€/g)", "Trend"])
    
    if 'current_timestamp' not in st.session_state:
        st.session_state.current_timestamp = None
    
    if 'show_only_changes' not in st.session_state:
        st.session_state.show_only_changes = False

    # Layout for fetch button and timestamp selection
    col1, col2 = st.columns(2)

    with col1:
        if st.button("Fetch Prices", key="fetch"):
            with st.spinner("Fetching current prices..."):
                df = fetch_product_data()
                if df is not None and not df.empty:
                    # Add trend analysis
                    df_with_trend = add_trend_analysis(df)
                    st.session_state.product_df = df_with_trend
                    
                    # Save the original data (without trend) to database
                    if save_to_db(df):
                        st.success("Prices updated successfully and saved to database!")
                        # Update current timestamp
                        timestamps = get_all_timestamps()
                        if timestamps:
                            st.session_state.current_timestamp = timestamps[0]
                    else:
                        st.success("Prices updated successfully!")
                else:
                    st.error("Failed to fetch prices. Displaying previous data if available.")

    with col2:
        # Dropdown for historical data
        timestamps = get_all_timestamps()
        if timestamps:
            selected_timestamp = st.selectbox("Select historical data:", timestamps)
            if st.button("Load Selected Data"):
                historical_df = get_data_by_timestamp(selected_timestamp)
                if historical_df is not None:
                    # Add trend analysis to historical data
                    historical_df_with_trend = add_trend_analysis(historical_df, selected_timestamp)
                    st.session_state.product_df = historical_df_with_trend
                    st.session_state.current_timestamp = selected_timestamp
                    st.success(f"Loaded data from {selected_timestamp}")
                else:
                    st.error("Failed to load historical data.")
        else:
            st.info("No historical data available. Fetch prices to create the first record.")

    # Filter and Export options
    if not st.session_state.product_df.empty:
        col3, col4 = st.columns(2)
        
        with col3:
            # Filter checkbox
            show_only_changes = st.checkbox(
                "Show only price changes", 
                value=st.session_state.show_only_changes,
                help="Filter to show only products with price changes"
            )
            st.session_state.show_only_changes = show_only_changes
        
        with col4:
            # Export to CSV option
            csv = st.session_state.product_df.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="Download CSV",
                data=csv,
                file_name='sanvivo_prices.csv',
                mime='text/csv',
                key='download-csv'
            )

    # Display the data table with styled trend indicators
    if not st.session_state.product_df.empty and "Trend" in st.session_state.product_df.columns:
        # Create a styled dataframe
        df_display = st.session_state.product_df.copy()
        
        # Apply filter if requested
        if st.session_state.show_only_changes:
            # Filter to show only products with price changes or new products
            # Exclude "→ Unchanged" and "First data point"
            df_display = df_display[~df_display["Trend"].isin(["→ Unchanged", "First data point"])]
            
            if df_display.empty:
                st.info("No price changes found in the current dataset.")
                # Show unfiltered data if filtered is empty
                df_display = st.session_state.product_df.copy()
        
        # Apply styling with color-coded trend indicators
        st.dataframe(
            df_display,
            column_config={
                "Trend": st.column_config.TextColumn(
                    "Price Trend",
                    help="Price change compared to previous data"
                ),
                "Price (€/g)": st.column_config.NumberColumn(
                    "Price (€/g)",
                    format="%.2f €"
                )
            },
            use_container_width=True
        )
    else:
        st.dataframe(st.session_state.product_df, use_container_width=True)

    # Display timestamp information if data is loaded
    if not st.session_state.product_df.empty:
        if st.session_state.current_timestamp:
            st.caption(f"Data from {st.session_state.current_timestamp}. Source: DrAnsay API.")
        else:
            st.caption("Data sourced from DrAnsay API.")

if __name__ == "__main__":
    main() 