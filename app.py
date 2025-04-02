import streamlit as st
import requests
import pandas as pd
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
API_ENDPOINT = "https://europe-west3-au-digital.cloudfunctions.net/dransay/api/webshop/products?sandbox=0"
API_KEY = os.getenv("DRANSAY_API_KEY")
HEADERS = {"x-api-key": API_KEY}

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

# --- Streamlit UI ---
st.set_page_config(page_title="Sanvivo Pricing Tool", layout="wide")

st.title("Sanvivo Pricing Tool")
st.markdown("Real-time price comparison tool for medical cannabis products.")

# Initialize session state for storing the dataframe with new columns
if 'product_df' not in st.session_state:
    st.session_state.product_df = pd.DataFrame(columns=["Sorte", "Kultivar", "Pharmacy ID", "Price (€/g)"])

col1, col2 = st.columns(2)

with col1:
    if st.button("Fetch Prices", key="fetch"):
        with st.spinner("Fetching current prices..."):
            df = fetch_product_data()
            if df is not None:
                st.session_state.product_df = df
                st.success("Prices updated successfully!")
            else:
                st.error("Failed to fetch prices. Displaying previous data if available.")

with col2:
    if not st.session_state.product_df.empty:
        csv = st.session_state.product_df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Download CSV",
            data=csv,
            file_name='sanvivo_prices.csv',
            mime='text/csv',
            key='download-csv'
        )

# Display the data table
st.dataframe(st.session_state.product_df, use_container_width=True)

st.caption("Data sourced from DrAnsay API.") 