// Dashboard.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Flex,
  Box,
  VStack,
  Text as ChakraText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Button,
  useDisclosure,
  HStack,
  Avatar,
  Spinner,
} from '@chakra-ui/react';
import { Agent, Message } from '../types/Agent';
import Sidebar from './Sidebar';
import axiosInstance from '../api/axiosConfig';
import { FaRobot } from 'react-icons/fa';

interface DashboardProps {
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsAuthenticated }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentFile, setAgentFile] = useState<File | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  const {
    isOpen: isAgentModalOpen,
    onOpen: onAgentModalOpen,
    onClose: onAgentModalClose,
  } = useDisclosure();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleAgentClick = (agent: Agent) => {
    if (selectedAgent?.id === agent.id) {
      setSelectedAgent({ ...agent, chatHistory: [] });
    } else {
      setSelectedAgent(null);
    }
  };

  const handleCreateAgent = () => {
    setEditAgent(null);
    setAgentName('');
    setAgentPrompt('');
    onAgentModalOpen();
  };

  const handleEditAgent = (agent: Agent) => {
    setEditAgent(agent);
    setAgentName(agent.name);
    setAgentPrompt(agent.prompt);
    onAgentModalOpen();
  };

  const handleDeleteAgent = (agent: Agent) => {
    setAgents((prevAgents) => prevAgents.filter((a) => a.id !== agent.id));
    if (selectedAgent?.id === agent.id) {
      setSelectedAgent(null);
    }
    // TODO: Delete agent on backend
  };

  // Added 'async' keyword here
  const handleSaveAgent = async () => {
    if (editAgent) {
      // Update existing agent
      const updatedAgent = { ...editAgent, name: agentName, prompt: agentPrompt };
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === updatedAgent.id ? updatedAgent : agent
        )
      );
      // TODO: Update agent on backend
    } else {
      const formData = new FormData();
      formData.append('name', agentName);
      formData.append('prompt', agentPrompt);
      if (agentFile) {
        formData.append('file', agentFile);
      }

      try {
        const response = await axiosInstance.post('/create-agent', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newAgent: Agent = {
          id: response.data.agent_id, // Map agent_id to id
          name: response.data.name,
          prompt: response.data.prompt,
          chatHistory: [],
          files: response.data.files ? [response.data.files] : [],
        };
        console.log('Agenti za usera', response.data)

        setAgents([...agents, newAgent]);
        setAgentName('');
        setAgentPrompt('');
        setAgentFile(null);
        onAgentModalClose();
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          console.error('Unauthorized. Please log in again.');
          setIsAuthenticated(false);
        } else {
          console.error('Error creating agent:', error);
        }
      }
    } // Added missing closing brace
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const handleUploadFile = (agent: Agent, files: FileList | null) => {
    if (files) {
      // Handle file upload
      const uploadedFiles = Array.from(files);
      const updatedAgent = {
        ...agent,
        files: [...(agent.files || []), ...uploadedFiles],
      };
      setAgents((prevAgents) =>
        prevAgents.map((a) => (a.id === agent.id ? updatedAgent : a))
      );
      // TODO: Upload files to backend
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() !== '' && selectedAgent) {
      const newMessage: Message = {
        sender: 'user',
        text: currentMessage,
      };
      const updatedAgent = {
        ...selectedAgent,
        chatHistory: [...(selectedAgent.chatHistory || []), newMessage],
      };
      setSelectedAgent(updatedAgent);
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === updatedAgent.id ? updatedAgent : agent
        )
      );
      setCurrentMessage('');
      scrollToBottom();
      // Simulate streaming response
      simulateStreamingResponse(updatedAgent);
    }
  };

  const simulateStreamingResponse = (agent: Agent) => {
    setIsStreaming(true);
    const responseText = 'This is a simulated response from the agent.';
    let index = 0;
    const interval = setInterval(() => {
      if (index <= responseText.length) {
        const streamingMessage: Message = {
          sender: 'bot',
          text: responseText.slice(0, index),
        };
        const updatedAgent = {
          ...agent,
          chatHistory: [...(agent.chatHistory || []), streamingMessage],
        };
        setSelectedAgent(updatedAgent);
        setAgents((prevAgents) =>
          prevAgents.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
        );
        scrollToBottom();
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 50);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(()=>{
    scrollToBottom()
    const agentsResponse=axiosInstance.get('/get-agents')
    agentsResponse.then((response)=>{
      setAgents(response.data)
    })

  },[])

  return (
    <Flex h="100vh">
      {/* Sidebar component */}
      <Sidebar
        agents={agents}
        onAgentClick={handleAgentClick}
        onCreateAgent={handleCreateAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
        onLogout={handleLogout}
        onUploadFile={handleUploadFile}
      />

      {/* Main content area */}
      <Flex flex="1" direction="column" p={4}>
        {selectedAgent ? (
          <Flex direction="column" h="100%">
            <Flex align="center" mb={4}>
              <Avatar icon={<FaRobot />} mr={2} />
              <ChakraText fontSize="2xl">{selectedAgent.name}</ChakraText>
            </Flex>
            <Box
              flex="1"
              bg="gray.100"
              p={4}
              borderRadius="md"
              overflowY="auto"
            >
              <VStack spacing={4} align="stretch">
                {selectedAgent.chatHistory?.map((message, index) => (
                  <Flex
                    key={index}
                    justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                  >
                    <Box
                      bg={message.sender === 'user' ? 'blue.500' : 'gray.300'}
                      color={message.sender === 'user' ? 'white' : 'black'}
                      p={3}
                      borderRadius="md"
                      maxW="70%"
                    >
                      <ChakraText whiteSpace="pre-wrap">
                        {message.text}
                      </ChakraText>
                    </Box>
                  </Flex>
                ))}
                {isStreaming && (
                  <Flex justify="flex-start">
                    <Box
                      bg="gray.300"
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
            </Box>
            <HStack mt={4}>
              <Input
                placeholder="Type your message..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <Button
                colorScheme="blue"
                onClick={handleSendMessage}
                isLoading={isStreaming}
              >
                Send
              </Button>
            </HStack>
          </Flex>
        ) : (
          <Flex flex="1" align="center" justify="center">
            <ChakraText>Select an agent to start chatting</ChakraText>
          </Flex>
        )}
      </Flex>

      {/* Modal for Creating/Editing Agent */}
      <Modal isOpen={isAgentModalOpen} onClose={onAgentModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editAgent ? 'Edit Agent' : 'Create a New Agent'}</ModalHeader>
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
              <Input
                type="file"
                onChange={(e) => setAgentFile(e.target.files ? e.target.files[0] : null)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSaveAgent}>
              {editAgent ? 'Save' : 'Create'}
            </Button>
            <Button variant="ghost" onClick={onAgentModalClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Dashboard;