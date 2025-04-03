import sqlite3
import pandas as pd
import datetime

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