// src/App.tsx
import React, { useState, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import Auth from './Auth';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <ChakraProvider>
      {isAuthenticated ? (
        <Dashboard setIsAuthenticated={setIsAuthenticated} />
      ) : (
        <Auth setIsAuthenticated={setIsAuthenticated} />
      )}
    </ChakraProvider>
  );
};

export default App;