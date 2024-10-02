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
} from '@chakra-ui/react';
import {
  FiUser,
  FiPlus,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
} from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import axios from 'axios';

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
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
      const response = await axios.get('http://localhost:8000/api/agents');
      console.log('Agents API Response:', response.data);
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]); // Ensure agents is always an array
    }
  };

  const handleAgentCreate = async () => {
    try {
      // Upload files to backend
      const formData = new FormData();
      agentFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('name', agentName);
      formData.append('prompt', agentPrompt);

      const response = await axios.post('http://localhost:8000/api/agents', formData);
      const newAgent = response.data;
      setAgents([...agents, newAgent]);
      setAgentName('');
      setAgentPrompt('');
      setAgentFiles([]);
      onClose();
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  const handleAgentClick = async (agent: Agent) => {
    setSelectedAgent(agent);
    // Fetch conversation history from backend
    try {
      const response = await axios.get(`http://localhost:8000/api/agents/${agent.id}/messages`);
      setSelectedAgent({ ...agent, chatHistory: response.data });
    } catch (error) {
      console.error('Error fetching conversation history:', error);
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
      // Send message to backend and get response
      try {
        const response = await axios.post(
          `/api/agents/${selectedAgent.id}/messages`,
          { text: userMessage.text }
        );
        const botMessage: Message = { sender: 'bot', text: response.data.text };
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
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div
          className={`${
            isSidebarOpen ? 'w-64' : 'w-20'
          } flex flex-col h-full p-4 bg-white border border-blue-200 m-4 rounded-md transition-all duration-300`}
        >
          {/* Toggle Sidebar Button */}
          <div className="flex items-center justify-between mb-4">
            {isSidebarOpen && (
              <Text className="text-xl font-bold">Agents</Text>
            )}
            <IconButton
              icon={
                isSidebarOpen ? <FiChevronLeft /> : <FiChevronRight />
              }
              aria-label="Toggle Sidebar"
              onClick={toggleSidebar}
              variant="ghost"
              colorScheme="blue"
              size="sm"
            />
          </div>
          <VStack
            spacing={4}
            align="stretch"
            className="flex-1 overflow-auto"
            divider={<div className="border-t border-blue-200"></div>}
          >
            <IconButton
              icon={<FiPlus />}
              aria-label="Add new agent"
              colorScheme="blue"
              onClick={onOpen}
              size="md"
              className="border border-blue-200"
            />
            {agents.map((agent) => (
              <div key={agent.id} className="relative">
                {isSidebarOpen ? (
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      onClick={() => handleAgentClick(agent)}
                      size="md"
                      justifyContent="flex-start"
                      leftIcon={
                        <Avatar icon={<FaRobot />} size="xs" />
                      }
                      className="border border-blue-200"
                      rightIcon={
                        <IconButton
                          icon={<FiChevronDown />}
                          aria-label="Show PDFs"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePDFList(agent.id);
                          }}
                        />
                      }
                    >
                      {agent.name}
                    </Button>
                    <Collapse in={showPDFList[agent.id]}>
                      <VStack
                        align="start"
                        spacing={2}
                        className="pl-8 mt-2"
                      >
                        {agent.files.map((file) => (
                          <Text key={file.id} fontSize="sm">
                            {file.name}
                          </Text>
                        ))}
                      </VStack>
                    </Collapse>
                  </div>
                ) : (
                  <IconButton
                    icon={<Avatar icon={<FaRobot />} size="sm" />}
                    aria-label={agent.name}
                    onClick={() => handleAgentClick(agent)}
                    size="md"
                    variant="ghost"
                    colorScheme="gray"
                    className="border border-blue-200"
                  />
                )}
              </div>
            ))}
            <IconButton
              icon={<FiSettings />}
              aria-label="Settings"
              colorScheme="gray"
              size="md"
              className="border border-blue-200 mt-auto"
            />
          </VStack>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 h-full p-4 m-4 bg-white border border-blue-200 rounded-md">
          {selectedAgent ? (
            <>
              <div className="flex items-center mb-4">
                <Avatar
                  icon={<FaRobot />}
                  size="md"
                  className="bg-teal-500 mr-2"
                />
                <Text fontSize="2xl">Chat with {selectedAgent.name}</Text>
              </div>
              <div className="flex flex-col flex-1 overflow-auto p-4 bg-gray-100 rounded-md">
                {selectedAgent.chatHistory?.map((message, index) => (
                  <div
                    key={index}
                    className={`flex mb-2 ${
                      message.sender === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-black border border-gray-200'
                      } p-3 rounded-md max-w-md`}
                    >
                      <Text>{message.text}</Text>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="mt-4">
                <HStack>
                  <Input
                    placeholder="Type your message..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                  />
                  <Button colorScheme="blue" onClick={handleSendMessage}>
                    Send
                  </Button>
                </HStack>
              </div>
            </>
          ) : (
            <Text>Select an agent to start chatting!</Text>
          )}
        </div>
      </div>

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
            <Button colorScheme="blue" mr={3} onClick={handleAgentCreate}>
              Create
            </Button>
            <Button variant="ghost" onClick={onClose}>
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
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-8 bg-white border border-blue-200 rounded-md">
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
        </div>
      </div>
    </ChakraProvider>
  );
};

export default App;