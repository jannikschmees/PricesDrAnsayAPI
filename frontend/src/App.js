import React, { useState, useEffect } from 'react';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  Container, 
  Box,
  Typography,
  Paper
} from '@mui/material';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import PriceTable from './components/PriceTable';
import Footer from './components/Footer';
import { fetchCurrentPrices, fetchTimestamps, fetchHistoricalPrices } from './services/api';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green color
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    }
  },
});

function App() {
  const [priceData, setPriceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timestamps, setTimestamps] = useState([]);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [filters, setFilters] = useState({
    showOnlyChanges: false,
    hideStanvivoBestPrices: false
  });

  // Fetch timestamps on component mount
  useEffect(() => {
    const getTimestamps = async () => {
      try {
        const response = await fetchTimestamps();
        setTimestamps(response.timestamps);
      } catch (err) {
        setError("Failed to load timestamps. Please try again later.");
      }
    };
    
    getTimestamps();
  }, []);

  // Function to fetch current prices
  const handleFetchCurrentPrices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchCurrentPrices();
      setPriceData(response.data);
      setCurrentTimestamp(response.timestamp);
      
      // Refresh timestamps after successful fetch
      const timestamps = await fetchTimestamps();
      setTimestamps(timestamps.timestamps);
    } catch (err) {
      setError("Failed to fetch current prices. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load historical data
  const handleLoadHistoricalData = async (timestamp) => {
    if (!timestamp) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchHistoricalPrices(timestamp);
      setPriceData(response.data);
      setCurrentTimestamp(response.timestamp);
    } catch (err) {
      setError(`Failed to load data from ${timestamp}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters to the data
  const filteredData = priceData.filter(item => {
    // Filter out unchanged prices if showOnlyChanges is true
    if (filters.showOnlyChanges) {
      // Only show items with price increases, decreases, or new products
      if (item.Trend === "→ Unchanged" || 
          item.Trend === "First data point" || 
          !item.Trend.includes("↑") && 
          !item.Trend.includes("↓") && 
          item.Trend !== "New product") {
        return false;
      }
    }
    
    // Filter out Sanvivo's best prices if hideStanvivoBestPrices is true
    if (filters.hideStanvivoBestPrices && 
        (item["Pharmacy ID"] === "Sanvivo" || 
         item["Pharmacy ID"] === "8I6qNL3zUifl8peYH9Tu1TcOXSt1")) {
      return false;
    }
    
    return true;
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default
      }}>
        <Header />
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <ControlPanel 
              onFetchPrices={handleFetchCurrentPrices}
              onLoadHistoricalData={handleLoadHistoricalData}
              timestamps={timestamps}
              isLoading={isLoading}
              filters={filters}
              onFilterChange={handleFilterChange}
              priceData={priceData}
            />
          </Paper>
          
          {error && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          )}
          
          <Paper sx={{ p: 3 }}>
            <PriceTable 
              data={filteredData} 
              isLoading={isLoading} 
              timestamp={currentTimestamp}
            />
          </Paper>
        </Container>
        
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App; 