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
  Box, 
  TextField,
  IconButton,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const ControlPanel = ({
  onFetchPrices,
  onLoadHistoricalData,
  timestamps,
  isLoading,
  filters,
  onFilterChange,
  priceData,
  groupNames,
  selectedGroup,
  onGroupSelect,
  onAddGroup,
  onDeleteGroup,
  viewMode,
  onViewModeChange
}) => {
  const [selectedTimestamp, setSelectedTimestamp] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

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

  const handleGroupChange = (event) => {
    onGroupSelect(event.target.value);
  };

  const handleNewGroupNameChange = (event) => {
    setNewGroupName(event.target.value);
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  const handleDeleteGroup = (groupName) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      onDeleteGroup(groupName);
    }
  };

  const handleViewMode = (event, newMode) => {
    if (newMode !== null) {
      onViewModeChange(newMode);
    }
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
      
      <Grid container spacing={3} alignItems="center">
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
        
        {/* Filter Options Row */}
        <Grid item xs={12} container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <Typography variant="subtitle2">Filters:</Typography>
          </Grid>
          {/* Basic Filters */}
          <Grid item xs>
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
                label="Price Changes"
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
                label="Hide Sanvivo"
              />
            </FormGroup>
          </Grid>
          
          {/* View Mode Toggle */}
          <Grid item>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewMode}
              aria-label="view mode"
              size="small"
            >
              <ToggleButton value="all" aria-label="view all products">
                <VisibilityIcon sx={{ mr: 0.5 }} fontSize="small" />
                View All
              </ToggleButton>
              <ToggleButton 
                value="groupOnly" 
                aria-label="view group only" 
                disabled={selectedGroup === 'all'}
              >
                <VisibilityOffIcon sx={{ mr: 0.5 }} fontSize="small" />
                Watch Group
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          {/* Group Filter Dropdown */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="group-filter-label">Select/Edit Group</InputLabel>
              <Select
                labelId="group-filter-label"
                value={selectedGroup}
                label="Select/Edit Group"
                onChange={handleGroupChange}
                disabled={isLoading || !priceData.length}
                startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="all">
                  <em>All Products</em>
                </MenuItem>
                {groupNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                    {name !== "My Favorites" && (
                      <IconButton 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(name); }} 
                        sx={{ ml: 'auto', p: 0.2 }}
                        aria-label={`delete group ${name}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Add New Group Row */}
        <Grid item xs={12} container spacing={1} alignItems="center">
          <Grid item xs>
            <TextField 
              label="New Group Name"
              variant="outlined"
              size="small"
              fullWidth
              value={newGroupName}
              onChange={handleNewGroupNameChange}
              onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
            />
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleAddGroup}
              disabled={!newGroupName.trim()}
              startIcon={<AddCircleOutlineIcon />}
            >
              Add Group
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ControlPanel; 