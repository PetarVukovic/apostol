import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  VStack,
  Input,
  Avatar,
  Text as ChakraText,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { FaRobot } from 'react-icons/fa';
import Sidebar from './Sidebar';
import { Agent, Message } from '../types/Agent';



interface DashboardProps {
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsAuthenticated }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleCreateAgent = () => {
    setEditAgent(null);
    setAgentName('');
    setAgentPrompt('');
    onOpen();
  };

  const handleEditAgent = (agent: Agent) => {
    setEditAgent(agent);
    setAgentName(agent.name);
    setAgentPrompt(agent.prompt);
    onOpen();
  };

  const handleDeleteAgent = (agentId: number) => {
    setAgents((prevAgents) => prevAgents.filter((a) => a.id !== agentId));
    if (selectedAgent && selectedAgent.id === agentId) {
      setSelectedAgent(null);
    }
  };

  const handleSaveAgent = () => {
    if (editAgent) {
      // Update existing agent
      setIsUpdatingAgent(true);
      setTimeout(() => {
        setAgents((prevAgents) =>
          prevAgents.map((agent) =>
            agent.id === editAgent.id
              ? { ...agent, name: agentName, prompt: agentPrompt }
              : agent
          )
        );
        setIsUpdatingAgent(false);
        onClose();
      }, 1000);
    } else {
      // Create new agent
      setIsCreatingAgent(true);
      setTimeout(() => {
        const newAgent: Agent = {
          id: agents.length + 1,
          name: agentName,
          prompt: agentPrompt,
          files: [],
          chatHistory: [],
        };
        setAgents([...agents, newAgent]);
        setIsCreatingAgent(false);
        onClose();
      }, 1000);
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() !== '' && selectedAgent) {
      const newMessage: Message = {
        sender: 'user',
        text: currentMessage,
      };
      setSelectedAgent({
        ...selectedAgent,
        chatHistory: [...selectedAgent.chatHistory, newMessage],
      });
      setCurrentMessage('');
      setIsSendingMessage(true);
      setTimeout(() => {
        setIsSendingMessage(false);
      }, 1000);
    }
  };

  return (
    <Flex h="100vh">
      {/* Sidebar */}
      <Sidebar
        agents={agents}
        onAgentClick={handleAgentClick}
        onCreateAgent={handleCreateAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <Flex flex="1" direction="column" h="100%" p={4}>
        {selectedAgent ? (
          <Flex
            flex="1"
            direction="column"
            overflowY="auto"
            p={4}
            bg="white"
            border="1px"
            borderColor="blue.200"
            borderRadius="md"
            boxShadow="md"
          >
            <Flex align="center" mb={4}>
              <Avatar icon={<FaRobot />} size="md" mr={2} />
              <ChakraText fontSize="2xl">Chat with {selectedAgent.name}</ChakraText>
            </Flex>

            <VStack spacing={4} align="stretch" flex="1" overflowY="auto">
              {selectedAgent.chatHistory?.map((message, index) => (
                <Flex
                  key={index}
                  justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                >
                  <Box
                    bg={message.sender === 'user' ? 'blue.500' : 'gray.100'}
                    color={message.sender === 'user' ? 'white' : 'black'}
                    p={3}
                    borderRadius="md"
                    maxW="70%"
                  >
                    <ChakraText>{message.text}</ChakraText>
                  </Box>
                </Flex>
              ))}
              {isStreaming && (
                <Flex justify="flex-start">
                  <Box
                    bg="gray.100"
                    color="black"
                    p={3}
                    borderRadius="md"
                    maxW="70%"
                  >
                    {/* Streaming Indicator */}
                  </Box>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </VStack>

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
          <Flex flex="1" align="center" justify="center">
            <ChakraText>Select an agent to start chatting!</ChakraText>
          </Flex>
        )}
      </Flex>

      {/* Modal for creating or editing an agent */}
      <Modal isOpen={isOpen} onClose={onClose}>
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
              <Input type="file" multiple onChange={(e) => {}} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleSaveAgent}
              isLoading={editAgent ? isUpdatingAgent : isCreatingAgent}
            >
              {editAgent ? 'Save' : 'Create'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Dashboard;