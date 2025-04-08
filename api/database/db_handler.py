import sqlite3
import pandas as pd
import datetime
import json

# Database path
DB_PATH = "sanvivo_prices.db"

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
    
    # Create table for storing detailed price data from all pharmacies
    c.execute('''
        CREATE TABLE IF NOT EXISTS detailed_price_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            pharmacy_id TEXT NOT NULL, 
            pharmacy_name TEXT NOT NULL,
            price REAL,
            UNIQUE(timestamp, product_id, pharmacy_id)
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

def save_detailed_prices(data, timestamp=None):
    """
    Save detailed price data from all top pharmacies for historical analysis.
    
    Args:
        data: List of dictionaries containing detailed price data
        timestamp: Optional timestamp (uses current time if not provided)
    
    Returns:
        bool: Success or failure
    """
    if not data:
        return False
    
    if timestamp is None:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        for item in data:
            c.execute("""
                INSERT OR REPLACE INTO detailed_price_data 
                (timestamp, product_id, product_name, pharmacy_id, pharmacy_name, price)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                timestamp,
                item.get("product_id"),
                item.get("product_name"),
                item.get("pharmacy_id"),
                item.get("pharmacy_name"),
                item.get("price")
            ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving detailed price data: {e}")
        conn.rollback()
        conn.close()
        return False

def get_pharmacy_price_history(product_id=None, pharmacy_id=None, start_date=None, end_date=None):
    """
    Get historical price data filtered by product and/or pharmacy.
    
    Args:
        product_id: Optional product ID to filter by
        pharmacy_id: Optional pharmacy ID to filter by
        start_date: Optional start date for the time range
        end_date: Optional end date for the time range
        
    Returns:
        DataFrame: Historical price data matching the criteria
    """
    conn = sqlite3.connect(DB_PATH)
    
    query = "SELECT * FROM detailed_price_data WHERE 1=1"
    params = []
    
    if product_id:
        query += " AND product_id = ?"
        params.append(product_id)
    
    if pharmacy_id:
        query += " AND pharmacy_id = ?"
        params.append(pharmacy_id)
    
    if start_date:
        query += " AND timestamp >= ?"
        params.append(start_date)
    
    if end_date:
        query += " AND timestamp <= ?"
        params.append(end_date)
    
    query += " ORDER BY timestamp DESC"
    
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    
    return df

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