import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  IconButton,
  Flex,
  Collapse,
  Center,
  Text as ChakraText,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiTrash,
  FiEdit,
  FiLogOut,
} from 'react-icons/fi';
import { FaRobot, FaCog } from 'react-icons/fa';
import { Agent } from '../types/Agent';

interface SidebarProps {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
  onCreateAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: number) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  agents,
  onAgentClick,
  onCreateAgent,
  onEditAgent,
  onDeleteAgent,
  onLogout,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAgentsExpanded, setIsAgentsExpanded] = useState(true);
  const [showPDFList, setShowPDFList] = useState<{ [key: number]: boolean }>({});

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleAgentsExpansion = () => {
    setIsAgentsExpanded(!isAgentsExpanded);
  };

  return (
    <Box
      w={isSidebarOpen ? '250px' : '80px'}
      transition="width 0.2s"
      bg="gray.200"
      overflow="hidden"
      position="relative"
      borderRadius="lg"
      m={4}
      boxShadow="md"
    >
      <VStack spacing={4} align="stretch" h="calc(100vh - 2rem)" overflowY="auto" p={2}>
        <Flex align="center" justify="space-between">
          <Button
            variant="ghost"
            leftIcon={<FaRobot />}
            rightIcon={
              isSidebarOpen ? (
                isAgentsExpanded ? (
                  <FiChevronUp />
                ) : (
                  <FiChevronDown />
                )
              ) : undefined
            }
            onClick={toggleAgentsExpansion}
            justifyContent="flex-start"
            flex="1"
            pl={isSidebarOpen ? 2 : 0}
          >
            {isSidebarOpen ? 'Agents' : null}
          </Button>
          <IconButton
            icon={isSidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
            aria-label="Toggle Sidebar"
            onClick={toggleSidebar}
            variant="ghost"
            size="sm"
          />
        </Flex>

        <Button
          leftIcon={<FiPlus />}
          variant="ghost"
          colorScheme="blue"
          onClick={onCreateAgent}
          justifyContent="flex-start"
          pl={isSidebarOpen ? 2 : 0}
        >
          {isSidebarOpen ? 'Add Agent' : null}
        </Button>

        <Collapse in={isAgentsExpanded || !isSidebarOpen} animateOpacity>
          {agents.length === 0 ? (
            isSidebarOpen && (
              <Center>
                <ChakraText>No agents available.</ChakraText>
              </Center>
            )
          ) : (
            agents.map((agent) => (
              <Box key={agent.id} pl={isSidebarOpen ? 4 : 0} pr={2}>
                <Flex align="center">
                  <Tooltip label={agent.name} isDisabled={isSidebarOpen} placement="right">
                    <Button
                      variant="ghost"
                      onClick={() => onAgentClick(agent)}
                      size="sm"
                      flex="1"
                      justifyContent={isSidebarOpen ? 'flex-start' : 'center'}
                      leftIcon={isSidebarOpen ? <FaRobot /> : undefined}
                      icon={!isSidebarOpen ? <FaRobot /> : undefined}
                      pl={isSidebarOpen ? 2 : 0}
                    >
                      {isSidebarOpen ? agent.name : null}
                    </Button>
                  </Tooltip>
                  {isSidebarOpen && (
                    <>
                      <IconButton
                        icon={showPDFList[agent.id] ? <FiChevronUp /> : <FiChevronDown />}
                        aria-label="Show PDFs"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPDFList((prev) => ({
                            ...prev,
                            [agent.id]: !prev[agent.id],
                          }));
                        }}
                      />
                      <IconButton
                        icon={<FiEdit />}
                        aria-label="Edit Agent"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAgent(agent);
                        }}
                      />
                      <IconButton
                        icon={<FiTrash />}
                        aria-label="Delete Agent"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAgent(agent.id);
                        }}
                      />
                    </>
                  )}
                </Flex>
              </Box>
            ))
          )}
        </Collapse>

        <IconButton
          icon={<FiLogOut />}
          aria-label="Logout"
          colorScheme="red"
          size="md"
          mt="auto"
          onClick={onLogout}
          alignSelf={isSidebarOpen ? 'flex-start' : 'center'}
        />
      </VStack>
    </Box>
  );
};

export default Sidebar;