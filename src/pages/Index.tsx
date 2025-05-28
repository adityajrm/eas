
import React from 'react'; // Add explicit React import
import { AppProvider } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';
import Layout from '../components/Layout';

const Index = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <Layout />
      </AppProvider>
    </ThemeProvider>
  );
};

export default Index;
