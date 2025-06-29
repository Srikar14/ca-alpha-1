// components/AppTopBar.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

interface AppTopBarProps {
  open: boolean;
  onDrawerOpen: () => void;
}

const AppTopBar: React.FC<AppTopBarProps> = ({ open, onDrawerOpen }) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) =>
          theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        ...(open && {
          marginLeft: 350,
          width: `calc(100% - 350px)`,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }),
      }}
    >
      <Toolbar>
        {!open && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onDrawerOpen}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" noWrap component="div">
          CA Dashboard
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default AppTopBar;
