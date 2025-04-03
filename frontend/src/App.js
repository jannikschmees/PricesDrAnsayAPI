import React, { useState, useEffect, useCallback } from 'react';
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

// Function to load groups from localStorage
const loadGroupsFromStorage = () => {
  const storedGroups = localStorage.getItem('productGroups');
  if (storedGroups) {
    try {
      const parsed = JSON.parse(storedGroups);
      // Convert arrays back to Sets
      Object.keys(parsed).forEach(key => {
        parsed[key] = new Set(parsed[key]);
      });
      return parsed;
    } catch (e) {
      console.error("Failed to parse groups from localStorage", e);
      return { "My Favorites": new Set() }; // Default on error
    }
  } 
  return { "My Favorites": new Set() }; // Default if nothing stored
};

// Function to save groups to localStorage
const saveGroupsToStorage = (groups) => {
  try {
    // Convert Sets to arrays for JSON stringification
    const storableGroups = {};
    Object.keys(groups).forEach(key => {
      storableGroups[key] = Array.from(groups[key]);
    });
    localStorage.setItem('productGroups', JSON.stringify(storableGroups));
  } catch (e) {
    console.error("Failed to save groups to localStorage", e);
  }
};

function App() {
  const [priceData, setPriceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timestamps, setTimestamps] = useState([]);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  
  // --- Group State ---
  const [productGroups, setProductGroups] = useState(loadGroupsFromStorage()); 
  const [groupNames, setGroupNames] = useState(Object.keys(productGroups));
  const [selectedGroup, setSelectedGroup] = useState('all'); 
  // --- End Group State ---

  // --- View Mode State ---
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'groupOnly'
  // --- End View Mode State ---

  const [filters, setFilters] = useState({
    showOnlyChanges: false,
    hideStanvivoBestPrices: false,
    // showOnlyCart: false // Removed cart filter
  });

  // Save groups whenever they change
  useEffect(() => {
    saveGroupsToStorage(productGroups);
    setGroupNames(Object.keys(productGroups)); // Keep groupNames in sync
  }, [productGroups]);

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

  // Handle filter changes (excluding group selection)
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle group selection change
  const handleGroupSelect = (groupName) => {
    setSelectedGroup(groupName);
  };

  // Handle view mode change
  const handleViewModeChange = (newMode) => {
    // Only allow 'groupOnly' mode if a specific group is selected
    if (newMode === 'groupOnly' && selectedGroup === 'all') {
      // Optional: Add user feedback here (e.g., toast notification)
      console.warn("Select a specific group to enter 'Watch Mode'.");
      return; 
    }
    setViewMode(newMode);
  };

  // --- Group Management Functions ---
  const addGroup = useCallback((name) => {
    console.log("[App] Attempting to add group:", name);
    if (name && !productGroups[name]) { 
      setProductGroups(prevGroups => {
        console.log("[App] Updating state to add group:", name);
        return {
          ...prevGroups,
          [name]: new Set()
        };
      });
    } else {
      console.warn("[App] Group add failed (empty name or duplicate):", name);
    }
  }, [productGroups]);

  const deleteGroup = useCallback((name) => {
    console.log("[App] Attempting to delete group:", name);
    if (name && productGroups[name] && name !== "My Favorites") { 
       setProductGroups(prevGroups => {
        console.log("[App] Updating state to delete group:", name);
        const newGroups = { ...prevGroups };
        delete newGroups[name];
        return newGroups;
      });
      if (selectedGroup === name) {
        console.log("[App] Deleted group was selected, switching to 'all'");
        setSelectedGroup('all');
      }
    } else {
      console.warn("[App] Group delete failed (invalid name or default):", name);
    }
  }, [productGroups, selectedGroup]);

  const addProductToGroup = useCallback((productId, groupName) => {
    console.log(`[App] Attempting to add product ${productId} to group ${groupName}`);
    if (!groupName || groupName === 'all' || !productGroups[groupName]) {
      console.warn("[App] Add product failed: Invalid group name", groupName);
      return;
    }
    setProductGroups(prevGroups => {
      const groupSet = prevGroups[groupName];
      if (!groupSet.has(productId)) {
        console.log(`[App] Updating state: Adding product ${productId} to group ${groupName}`);
        const newSet = new Set(groupSet);
        newSet.add(productId);
        return { ...prevGroups, [groupName]: newSet };
      } 
      console.log(`[App] No state update: Product ${productId} already in group ${groupName}`);
      return prevGroups; // No change if already present
    });
  }, [productGroups]);

  const removeProductFromGroup = useCallback((productId, groupName) => {
    console.log(`[App] Attempting to remove product ${productId} from group ${groupName}`);
    if (!groupName || groupName === 'all' || !productGroups[groupName]) {
      console.warn("[App] Remove product failed: Invalid group name", groupName);
      return;
    }
     setProductGroups(prevGroups => {
      const groupSet = prevGroups[groupName];
      if (groupSet.has(productId)) {
        console.log(`[App] Updating state: Removing product ${productId} from group ${groupName}`);
        const newSet = new Set(groupSet);
        newSet.delete(productId);
        return { ...prevGroups, [groupName]: newSet };
      } 
      console.log(`[App] No state update: Product ${productId} not found in group ${groupName}`);
      return prevGroups; // No change if not present
    });
  }, [productGroups]);
  
  const isProductInGroup = useCallback((productId, groupName) => {
      // console.log(`[App] Checking if product ${productId} is in group ${groupName}`); // Optional: can be noisy
      if (!groupName || groupName === 'all' || !productGroups[groupName]) return false;
      const result = productGroups[groupName].has(productId);
      // console.log(`[App] Result: ${result}`);
      return result;
  }, [productGroups]);
  // --- End Group Management Functions ---

  // Apply filters to the data
  const filteredData = priceData.filter(item => {
    // View Mode Filter (only applies if 'groupOnly' mode is active)
    if (viewMode === 'groupOnly' && selectedGroup !== 'all') {
      if (!(productGroups[selectedGroup]?.has(item.id))) { 
        return false; // Hide items not in the selected group when in groupOnly mode
      }
    }

    // Filter out unchanged prices if showOnlyChanges is true
    if (filters.showOnlyChanges) {
      // Only show items with price increases, decreases, or new products
      if (item.Trend === "→ Unchanged" || 
          item.Trend === "First data point" || 
          (!item.Trend.includes("↑") && 
           !item.Trend.includes("↓") && 
           item.Trend !== "New product")) {
        return false;
      }
    }
    
    // Filter out Sanvivo's best prices if hideStanvivoBestPrices is true
    if (filters.hideStanvivoBestPrices && 
        item["Pharmacy ID"] === "Sanvivo") { 
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
              groupNames={groupNames} 
              selectedGroup={selectedGroup} 
              onGroupSelect={handleGroupSelect} 
              onAddGroup={addGroup}
              onDeleteGroup={deleteGroup}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
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
              selectedGroup={selectedGroup}
              onAddProductToGroup={addProductToGroup}
              onRemoveProductFromGroup={removeProductFromGroup}
              isProductInGroup={isProductInGroup}
              viewMode={viewMode}
            />
          </Paper>
        </Container>
        
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App; 