'use client';

import {ReactNode, useState} from 'react';
import {Link} from 'react-router-dom';
// import { useTheme } from '@mui/material/styles'; // Removed unused import
// import useMediaQuery from '@mui/material/useMediaQuery'; // Removed unused import
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu'; // MUI icon
import BookOpenIcon from '@mui/icons-material/Book'; // Replace Heroicon
import DocumentTextIcon from '@mui/icons-material/Article'; // Replace Heroicon

interface AppLayoutProps {
    children: ReactNode;
}

const drawerWidth = 288; // lg:w-72 equivalent

export default function AppLayout({children}: AppLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    // const theme = useTheme(); // Removed unused variable assignment
    /* const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); */ // Kept commented out

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navigation = [
        {name: 'My Vocabulary', href: '/', icon: BookOpenIcon},
        {name: 'My Texts', href: '/texts', icon: DocumentTextIcon},
    ];

    const drawerContent = (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <Toolbar>
                {/* Adjusted title style slightly */}
                <Typography variant="h6" noWrap component="div" sx={{fontWeight: 600}}>
                    Vibe Spanish Helper
                </Typography>
            </Toolbar>
            <Box sx={{overflowY: 'auto', flexGrow: 1}}>
                <List>
                    {navigation.map((item) => (
                        <ListItem key={item.name} disablePadding>
                            {/* Updated Link usage for react-router-dom */}
                            <Link to={item.href} style={{textDecoration: 'none', color: 'inherit', width: '100%'}}>
                                <ListItemButton onClick={() => mobileOpen && setMobileOpen(false)}>
                                    <ListItemIcon>
                                        {/* Use sx prop for icon styling */}
                                        <item.icon sx={{color: 'grey.600'}}/>
                                    </ListItemIcon>
                                    {/* Use sx prop for text styling */}
                                    <ListItemText primary={item.name} sx={{
                                        '& .MuiTypography-root': {
                                            fontWeight: 600,
                                            fontSize: '0.875rem'
                                        }
                                    }}/>
                                </ListItemButton>
                            </Link>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>
    );

    return (
        <Box sx={{display: 'flex', minHeight: '100vh', bgcolor: 'grey.100'}}>
            {/* AppBar (Top Header) */}
            <AppBar
                position="fixed"
                sx={{
                    width: {lg: `calc(100% - ${drawerWidth}px)`}, // Adjust width on large screens
                    ml: {lg: `${drawerWidth}px`}, // Margin left on large screens
                    bgcolor: 'white',
                    color: 'text.primary', // Ensure text color contrasts with white bg
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)', // Tailwind shadow-sm
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Toolbar sx={{height: '4rem'}}> {/* h-16 equivalent */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{mr: 2, display: {lg: 'none'}}} // Only show on mobile
                    >
                        <MenuIcon/>
                    </IconButton>
                    {/* Can add Title or other elements here if needed */}
                    <Box sx={{flexGrow: 1}}/> {/* Spacer */}
                </Toolbar>
            </AppBar>

            {/* Drawer (Sidebar) */}
            <Box
                component="nav"
                sx={{width: {lg: drawerWidth}, flexShrink: {lg: 0}}}
                aria-label="mailbox folders"
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: {xs: 'block', lg: 'none'},
                        '& .MuiDrawer-paper': {boxSizing: 'border-box', width: drawerWidth},
                    }}
                >
                    {drawerContent}
                </Drawer>
                {/* Desktop Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: {xs: 'none', lg: 'block'},
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: '1px solid',
                            borderColor: 'divider'
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3, // Default padding
                    width: {lg: `calc(100% - ${drawerWidth}px)`},
                    mt: '4rem', // Offset for AppBar height
                }}
            >
                <>{children}</>
            </Box>
        </Box>
    );
} 