import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';

const Header = () => {
  return (
    <AppBar position="static" elevation={3}>
      <Toolbar>
        <MedicationIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Sanvivo Pricing Tool
        </Typography>
        <Box>
          <Typography variant="subtitle2">
            Medical Cannabis Price Tracker
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 