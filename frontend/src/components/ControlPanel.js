import React, { useState } from 'react';
import { 
  Grid, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Divider, 
  Typography, 
  Box 
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const ControlPanel = ({
  onFetchPrices,
  onLoadHistoricalData,
  timestamps,
  isLoading,
  filters,
  onFilterChange,
  priceData
}) => {
  const [selectedTimestamp, setSelectedTimestamp] = useState('');

  const handleTimestampChange = (event) => {
    setSelectedTimestamp(event.target.value);
  };

  const handleLoadHistoricalData = () => {
    if (selectedTimestamp) {
      onLoadHistoricalData(selectedTimestamp);
    }
  };

  const handleFilterChange = (event) => {
    onFilterChange(event.target.name, event.target.checked);
  };

  // Function to generate CSV content
  const handleExportCSV = () => {
    if (!priceData.length) return;
    
    // Create CSV content from data
    const headers = Object.keys(priceData[0]).join(',');
    const rows = priceData.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download link
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sanvivo_prices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Control Panel</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={3}>
        {/* Fetch Current Prices Section */}
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onFetchPrices}
            disabled={isLoading}
            fullWidth
          >
            Fetch Current Prices
          </Button>
        </Grid>
        
        {/* Historical Data Section */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <FormControl fullWidth size="small">
                <InputLabel>Historical Data</InputLabel>
                <Select
                  value={selectedTimestamp}
                  onChange={handleTimestampChange}
                  label="Historical Data"
                  disabled={!timestamps.length || isLoading}
                >
                  {timestamps.map((timestamp) => (
                    <MenuItem key={timestamp} value={timestamp}>
                      {timestamp}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleLoadHistoricalData}
                disabled={!selectedTimestamp || isLoading}
                fullWidth
              >
                Load
              </Button>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Export Button */}
        <Grid item xs={12} md={4}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCSV}
            disabled={!priceData.length || isLoading}
            fullWidth
          >
            Export CSV
          </Button>
        </Grid>
        
        {/* Divider */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>
        
        {/* Filter Options */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>Filter Options:</Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.showOnlyChanges}
                  onChange={handleFilterChange}
                  name="showOnlyChanges"
                  color="primary"
                  disabled={isLoading || !priceData.length}
                />
              }
              label="Show only price changes"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.hideStanvivoBestPrices}
                  onChange={handleFilterChange}
                  name="hideStanvivoBestPrices"
                  color="primary"
                  disabled={isLoading || !priceData.length}
                />
              }
              label="Hide Sanvivo best prices"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ControlPanel; 