import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Chip
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import IconButton from '@mui/material/IconButton';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';

const PriceTable = ({ 
  data, 
  isLoading, 
  timestamp, 
  selectedGroup,
  onAddProductToGroup,
  onRemoveProductFromGroup,
  isProductInGroup,
  viewMode
}) => {
  // Function to render trend with appropriate styling
  const renderTrend = (trend) => {
    if (!trend) return null;
    
    if (trend.includes("↑")) {
      return (
        <Chip 
          icon={<ArrowUpwardIcon />} 
          label={trend.replace("↑", "")} 
          color="error" 
          size="small" 
          variant="outlined"
        />
      );
    }
    
    if (trend.includes("↓")) {
      return (
        <Chip 
          icon={<ArrowDownwardIcon />} 
          label={trend.replace("↓", "")} 
          color="success" 
          size="small" 
          variant="outlined"
        />
      );
    }
    
    if (trend.includes("→")) {
      return (
        <Chip 
          icon={<RemoveIcon />} 
          label="Unchanged" 
          color="default" 
          size="small" 
          variant="outlined"
        />
      );
    }
    
    if (trend === "New product") {
      return (
        <Chip 
          icon={<NewReleasesIcon />} 
          label="New" 
          color="info" 
          size="small" 
          variant="outlined"
        />
      );
    }
    
    return <Chip label={trend} size="small" variant="outlined" />;
  };

  // Function to calculate and format recommended price
  const calculateRecommendedPrice = (currentPrice) => {
    if (typeof currentPrice !== 'number') {
      return 'N/A'; // Handle cases where price is not a number
    }
    const recommended = currentPrice - 0.01;
    // Ensure recommended price doesn't go below zero (e.g., if original price is 0.00)
    return recommended >= 0 ? `${recommended.toFixed(2)} €` : `0.00 €`; 
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No data available. Click "Fetch Current Prices" to load data.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Price Data
          {timestamp && (
            <Typography component="span" variant="body2" color="text.secondary" ml={2}>
              Data from: {timestamp}
            </Typography>
          )}
        </Typography>
      </Box>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="price data table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              {viewMode === 'all' && <TableCell sx={{ width: '5%' }}></TableCell>}
              <TableCell>Sorte</TableCell>
              <TableCell>Kultivar</TableCell>
              <TableCell>Pharmacy ID</TableCell>
              <TableCell align="right">Price (€/g)</TableCell>
              <TableCell align="right">Recommended (€/g)</TableCell>
              <TableCell>Trend</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => {
              const inSelectedGroup = isProductInGroup(row.id, selectedGroup);
              const canModifyGroup = viewMode === 'all' && selectedGroup !== 'all';
              const currentPrice = row["Price (€/g)"];

              return (
                <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {viewMode === 'all' && (
                    <TableCell padding="checkbox">
                      <IconButton 
                        aria-label="toggle product in selected group"
                        disabled={!canModifyGroup || isLoading}
                        onClick={() => {
                          console.log(`[PriceTable] Button clicked for product ${row.id}. Selected group: ${selectedGroup}. In group: ${inSelectedGroup}`);
                          if (inSelectedGroup) {
                            onRemoveProductFromGroup(row.id, selectedGroup);
                          } else {
                            onAddProductToGroup(row.id, selectedGroup);
                          }
                        }}
                        color={inSelectedGroup ? "primary" : "default"}
                      >
                        {inSelectedGroup ? <PlaylistRemoveIcon /> : <PlaylistAddIcon />}
                      </IconButton>
                    </TableCell>
                  )}
                  <TableCell component="th" scope="row">
                    {row.Sorte}
                  </TableCell>
                  <TableCell>{row.Kultivar}</TableCell>
                  <TableCell>{row["Pharmacy ID"]}</TableCell>
                  <TableCell align="right">
                    {typeof currentPrice === 'number'
                      ? `${currentPrice.toFixed(2)} €`
                      : currentPrice}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'primary.dark', fontWeight: 'medium' }}>
                    {calculateRecommendedPrice(currentPrice)}
                  </TableCell>
                  <TableCell>{renderTrend(row.Trend)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="caption" color="text.secondary">
          Showing {data.length} products • Data source: DrAnsay API
        </Typography>
      </Box>
    </Box>
  );
};

export default PriceTable; 