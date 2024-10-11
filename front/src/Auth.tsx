// src/Auth.tsx
import React, { useState } from 'react';
import axiosInstance from './api/axiosConfig'; // Import axiosInstance
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  useToast,
} from '@chakra-ui/react';

interface AuthProps {
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const Auth: React.FC<AuthProps> = ({ setIsAuthenticated }) => {
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const toast = useToast();

  const handleLogin = async () => {
    try {
      const response = await axiosInstance.post('/login', {
        email: loginEmail,
        password: loginPassword,
      });

      // Assuming the response contains a token
      const token = response.data.token;
      localStorage.setItem('token', token); // Store token in localStorage

      setIsAuthenticated(true); // Update authentication state

      toast({
        title: 'Login successful.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Redirect or perform additional actions
    } catch (error: any) {
      toast({
        title: 'Login failed.',
        description:
          error.response?.data?.detail || 'An error occurred during login.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axiosInstance.post('/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
      });

      toast({
        title: 'Registration successful.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Optionally, log the user in after registration
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
      handleLogin(); // Automatically log in after registration
    } catch (error: any) {
      toast({
        title: 'Registration failed.',
        description:
          error.response?.data?.detail || 'An error occurred during registration.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Box
        className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg"
        bg="white"
      >
        <Tabs variant="enclosed" isFitted>
          <TabList mb="1em">
            <Tab>Login</Tab>
            <Tab>Register</Tab>
          </TabList>
          <TabPanels>
            {/* Login Panel */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl id="login-email" isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </FormControl>
                <FormControl id="login-password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </FormControl>
                <Button colorScheme="teal" onClick={handleLogin}>
                  Login
                </Button>
              </VStack>
            </TabPanel>

            {/* Register Panel */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl id="register-name" isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </FormControl>
                <FormControl id="register-email" isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </FormControl>
                <FormControl id="register-password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </FormControl>
                <Button colorScheme="teal" onClick={handleRegister}>
                  Register
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default Auth;