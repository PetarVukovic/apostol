// src/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Avatar,
  IconButton,
  Collapse,
  Spinner,
  Flex,
  Box,
  Center,
} from '@chakra-ui/react';
import {
  FiUser,
  FiPlus,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiTrash,
  FiEdit,
} from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import axios from 'axios';
import PDFViewer from './components/PDFViewer';

import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

interface Agent {
  id: number;
  name: string;
  prompt: string;
  files: FileInfo[];
  chatHistory: Message[];
}

interface FileInfo {
  id: number;
  name: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentFiles, setAgentFiles] = useState<File[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPDFList, setShowPDFList] = useState<{ [key: number]: boolean }>({});
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isAgentsExpanded, setIsAgentsExpanded] = useState(true);

  axios.defaults.baseURL = 'http://localhost:8000';

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedAgent?.chatHistory]);

  // Fetch agents from backend on component mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchAgents();
    }
  }, [isLoggedIn]);

  const fetchAgents = async () => {
    try {
      setIsLoadingAgents(true);
      const response = await axios.get('/api/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleAgentCreate = async () => {
    try {
      setIsCreatingAgent(true);
      // Upload files to backend
      const formData = new FormData();
      agentFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('name', agentName);
      formData.append('prompt', agentPrompt);

      const response = await axios.post('/api/agents', formData);
      const newAgent = response.data;
      setAgents([...agents, newAgent]);
      setAgentName('');
      setAgentPrompt('');
      setAgentFiles([]);
      onClose();
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleAgentClick = async (agent: Agent) => {
    setSelectedAgent(agent);
    setSelectedFile(null);
    // Fetch conversation history from backend
    try {
      setIsLoadingMessages(true);
      const response = await axios.get(`/api/agents/${agent.id}/messages`);
      setSelectedAgent({ ...agent, chatHistory: response.data });
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim() && selectedAgent) {
      const userMessage: Message = { sender: 'user', text: currentMessage };
      const updatedAgent = {
        ...selectedAgent,
        chatHistory: [...(selectedAgent.chatHistory || []), userMessage],
      };
      setSelectedAgent(updatedAgent);
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === updatedAgent.id ? updatedAgent : agent
        )
      );

      setCurrentMessage('');
      setIsStreaming(true);
      setIsSendingMessage(true);
      // Send message to backend and get response
      try {
        const response = await axios.post(
          `/api/agents/${selectedAgent.id}/messages`,
          { text: userMessage.text }
        );
        const botMessage: Message = {
          sender: 'bot',
          text: response.data.text,
        };
        const updatedAgentWithBot = {
          ...updatedAgent,
          chatHistory: [...updatedAgent.chatHistory, botMessage],
        };
        setSelectedAgent(updatedAgentWithBot);
        setAgents((prevAgents) =>
          prevAgents.map((agent) =>
            agent.id === updatedAgentWithBot.id ? updatedAgentWithBot : agent
          )
        );
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsStreaming(false);
        setIsSendingMessage(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAgentFiles(Array.from(e.target.files));
    }
  };

  // Toggle Sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle PDF List
  const togglePDFList = (agentId: number) => {
    setShowPDFList((prevState) => ({
      ...prevState,
      [agentId]: !prevState[agentId],
    }));
  };

  const handlePDFClick = (file: FileInfo) => {
    setSelectedFile(file);
  };

  const handleDeleteAgent = async (agent: Agent) => {
    try {
      setIsDeletingAgent(true);
      await axios.delete(`/api/agents/${agent.id}`);
      setAgents((prevAgents) => prevAgents.filter((a) => a.id !== agent.id));
      if (selectedAgent?.id === agent.id) {
        setSelectedAgent(null);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
    } finally {
      setIsDeletingAgent(false);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditAgent(agent);
    setAgentName(agent.name);
    setAgentPrompt(agent.prompt);
    setAgentFiles([]);
    onEditOpen();
  };

  const handleAgentUpdate = async () => {
    if (editAgent) {
      try {
        setIsUpdatingAgent(true);
        const formData = new FormData();
        agentFiles.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('name', agentName);
        formData.append('prompt', agentPrompt);

        const response = await axios.put(
          `/api/agents/${editAgent.id}`,
          formData
        );
        const updatedAgent = response.data;
        setAgents((prevAgents) =>
          prevAgents.map((agent) =>
            agent.id === updatedAgent.id ? updatedAgent : agent
          )
        );
        if (selectedAgent?.id === updatedAgent.id) {
          setSelectedAgent(updatedAgent);
        }
        setEditAgent(null);
        setAgentName('');
        setAgentPrompt('');
        setAgentFiles([]);
        onEditClose();
      } catch (error) {
        console.error('Error updating agent:', error);
      } finally {
        setIsUpdatingAgent(false);
      }
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await axios.delete(`/api/files/${fileId}`);
      if (editAgent) {
        const updatedFiles = editAgent.files.filter(
          (file) => file.id !== fileId
        );
        setEditAgent({ ...editAgent, files: updatedFiles });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Toggle Agents Expansion in Sidebar
  const toggleAgentsExpansion = () => {
    setIsAgentsExpanded(!isAgentsExpanded);
  };

  // Login Handler
  const handleLogin = (username: string, password: string) => {
    // Replace with actual authentication logic
    if (username === 'test' && password === 'test') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid credentials');
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <ChakraProvider>
      <Flex h="100vh">
        {/* Sidebar */}
        <Box
          w={isSidebarOpen ? '250px' : '60px'}
          transition="width 0.2s"
          bg="gray.200"
          overflow="hidden"
          position="relative"
        >
          <VStack
            spacing={4}
            align="stretch"
            h="100%"
            overflowY="auto"
            p={2}
          >
            {/* Sidebar Header */}
            <Flex align="center" justify="space-between">
              {isSidebarOpen && (
                <Button
                  variant="ghost"
                  leftIcon={<FiUser />}
                  rightIcon={
                    isAgentsExpanded ? <FiChevronUp /> : <FiChevronDown />
                  }
                  onClick={toggleAgentsExpansion}
                  justifyContent="space-between"
                  flex="1"
                >
                  Agents
                </Button>
              )}
              <IconButton
                icon={isSidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
                aria-label="Toggle Sidebar"
                onClick={toggleSidebar}
                variant="ghost"
                size="sm"
              />
            </Flex>

            {/* Add Agent Button */}
            {isSidebarOpen && (
              <Button
                leftIcon={<FiPlus />}
                variant="ghost"
                colorScheme="blue"
                onClick={onOpen}
                justifyContent="flex-start"
              >
                Add Agent
              </Button>
            )}

            {/* Agents List */}
            <Collapse in={isAgentsExpanded}>
              {isLoadingAgents ? (
                <Center>
                  <Spinner size="sm" />
                </Center>
              ) : (
                agents.map((agent) => (
                  <Box key={agent.id} pl={4} pr={2}>
                    <Flex align="center">
                      <Button
                        variant="ghost"
                        onClick={() => handleAgentClick(agent)}
                        size="sm"
                        flex="1"
                        justifyContent="flex-start"
                        leftIcon={<FaRobot />}
                      >
                        {agent.name}
                      </Button>
                      <IconButton
                        icon={
                          showPDFList[agent.id] ? (
                            <FiChevronUp />
                          ) : (
                            <FiChevronDown />
                          )
                        }
                        aria-label="Show PDFs"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePDFList(agent.id);
                        }}
                      />
                      <IconButton
                        icon={<FiEdit />}
                        aria-label="Edit Agent"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAgent(agent);
                        }}
                      />
                      <IconButton
                        icon={<FiTrash />}
                        aria-label="Delete Agent"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent);
                        }}
                        isLoading={isDeletingAgent}
                      />
                    </Flex>
                    <Collapse in={showPDFList[agent.id]}>
                      <VStack
                        align="start"
                        spacing={1}
                        pl={6}
                        mt={1}
                      >
                        {agent.files.map((file) => (
                          <Button
                            key={file.id}
                            variant="ghost"
                            size="sm"
                            justifyContent="flex-start"
                            onClick={() => handlePDFClick(file)}
                          >
                            {file.name}
                          </Button>
                        ))}
                      </VStack>
                    </Collapse>
                  </Box>
                ))
              )}
            </Collapse>

            {/* Settings Button */}
            <IconButton
              icon={<FiSettings />}
              aria-label="Settings"
              colorScheme="gray"
              size="md"
              mt="auto"
              mb={2}
            />
          </VStack>
        </Box>

        {/* Main Content Area */}
        <Flex flex="1" direction="column" h="100%">
          {selectedFile ? (
            <Box
              flex="1"
              overflowY="auto"
              p={4}
              m={4}
              bg="white"
              border="1px"
              borderColor="blue.200"
              borderRadius="md"
            >
              <PDFViewer
                fileId={selectedFile.id}
                fileName={selectedFile.name}
              />
            </Box>
          ) : selectedAgent ? (
            <Flex
              flex="1"
              direction="column"
              overflowY="auto"
              p={4}
              m={4}
              bg="white"
              border="1px"
              borderColor="blue.200"
              borderRadius="md"
            >
              {/* Chat Header */}
              <Flex align="center" mb={4}>
                <Avatar icon={<FaRobot />} size="md" mr={2} />
                <Text fontSize="2xl">Chat with {selectedAgent.name}</Text>
              </Flex>

              {/* Chat Messages */}
              <VStack spacing={4} align="stretch" flex="1" overflowY="auto">
                {isLoadingMessages ? (
                  <Center>
                    <Spinner size="xl" />
                  </Center>
                ) : (
                  selectedAgent.chatHistory?.map((message, index) => (
                    <Flex
                      key={index}
                      justify={
                        message.sender === 'user' ? 'flex-end' : 'flex-start'
                      }
                    >
                      <Box
                        bg={
                          message.sender === 'user' ? 'blue.500' : 'gray.100'
                        }
                        color={
                          message.sender === 'user' ? 'white' : 'black'
                        }
                        p={3}
                        borderRadius="md"
                        maxW="70%"
                      >
                        <Text>{message.text}</Text>
                      </Box>
                    </Flex>
                  ))
                )}
                {isStreaming && (
                  <Flex justify="flex-start">
                    <Box
                      bg="gray.100"
                      color="black"
                      p={3}
                      borderRadius="md"
                      maxW="70%"
                    >
                      <Spinner size="sm" />
                    </Box>
                  </Flex>
                )}
                <div ref={messagesEndRef} />
              </VStack>

              {/* Message Input */}
              <HStack mt={4}>
                <Input
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                />
                <Button
                  colorScheme="blue"
                  onClick={handleSendMessage}
                  isLoading={isSendingMessage}
                >
                  Send
                </Button>
              </HStack>
            </Flex>
          ) : (
            <Center flex="1">
              <Text>Select an agent to start chatting or view a PDF!</Text>
            </Center>
          )}
        </Flex>
      </Flex>

      {/* Modal for creating a new agent */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create a New Agent</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="Agent Name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
              <Textarea
                placeholder="Enter prompt for agent..."
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
              />
              <Input type="file" multiple onChange={handleFileUpload} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleAgentCreate}
              isLoading={isCreatingAgent}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for editing an agent */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Agent</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="Agent Name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
              <Textarea
                placeholder="Enter prompt for agent..."
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
              />
              <Input type="file" multiple onChange={handleFileUpload} />
              <Text>Existing Files:</Text>
              <VStack spacing={2} align="stretch">
                {editAgent?.files.map((file) => (
                  <HStack key={file.id} spacing={2}>
                    <Text>{file.name}</Text>
                    <IconButton
                      icon={<FiTrash />}
                      aria-label="Delete File"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                    />
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleAgentUpdate}
              isLoading={isUpdatingAgent}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
}

// Login Page Component
interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <ChakraProvider>
      <Flex align="center" justify="center" h="100vh" bg="gray.100">
        <Box p={8} bg="white" border="1px" borderColor="blue.200" borderRadius="md">
          <Text fontSize="2xl" mb={4}>
            Login
          </Text>
          <VStack spacing={4}>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              colorScheme="blue"
              onClick={() => onLogin(username, password)}
            >
              Login
            </Button>
          </VStack>
        </Box>
      </Flex>
    </ChakraProvider>
  );
};

export default App;