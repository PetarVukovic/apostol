import React, { useState, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import Auth from './Auth';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Provjeri je li token prisutan u localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true); // Ako postoji token, korisnik je autentificiran
    }
  }, []); // Prazan array znači da se ovo izvršava samo pri mountu komponente

  return (
    <ChakraProvider>
      {isAuthenticated ? (
        // Ako je autentificiran, prikaži Dashboard
        <Dashboard setIsAuthenticated={setIsAuthenticated} />
      ) : (
        // Ako nije autentificiran, prikaži Auth komponentu
        <Auth setIsAuthenticated={setIsAuthenticated} />
      )}
    </ChakraProvider>
  );
};

export default App;