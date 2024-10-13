// Sidebar.tsx

import React, { useState } from 'react';
import {
  Box,
  VStack,
  Button,
  IconButton,
  Flex,
  Collapse,
  Text as ChakraText,
  useDisclosure,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
} from '@chakra-ui/react';
import { FaRobot } from 'react-icons/fa';
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiLogOut,
  FiEdit,
  FiTrash,
  FiUpload,
  FiMenu,
} from 'react-icons/fi';
import { Agent } from '../types/Agent';

interface SidebarProps {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
  onCreateAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agent: Agent) => void;
  onLogout: () => void;
  onUploadFile: (agent: Agent, files: FileList | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  agents,
  onAgentClick,
  onCreateAgent,
  onEditAgent,
  onDeleteAgent,
  onLogout,
  onUploadFile,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Box
      w={isSidebarCollapsed ? '80px' : '250px'}
      bg="gray.200"
      p={2}
      borderRight="1px solid"
      borderColor="gray.300"
      h="100vh"
      transition="width 0.2s"
    >
      <VStack spacing={4} align="stretch">
        {/* Header with Toggle Button */}
        <Flex align="center" justify="space-between">
          {!isSidebarCollapsed && (
            <ChakraText fontSize="lg" fontWeight="bold">
              Agents
            </ChakraText>
          )}
          <IconButton
            icon={isSidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            aria-label="Toggle Sidebar"
            variant="ghost"
            onClick={toggleSidebar}
            size="sm"
          />
        </Flex>

        {/* Create New Agent Button */}
        <Tooltip label="Create New Agent" placement="right">
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onCreateAgent}
            variant="solid"
            size="sm"
            w="100%"
            justifyContent={isSidebarCollapsed ? 'center' : 'flex-start'}
          >
            {!isSidebarCollapsed && 'Create New Agent'}
          </Button>
        </Tooltip>

        {/* Agent List */}
        <Collapse in={!isSidebarCollapsed} animateOpacity>
          {agents.length === 0 ? (
            <ChakraText>No agents available.</ChakraText>
          ) : (
            agents.map((agent) => (
              <Flex
                key={agent.id}
                align="center"
                justify="space-between"
                w="100%"
                py={1}
              >
                <Button
                  variant="ghost"
                  onClick={() => onAgentClick(agent)}
                  leftIcon={<Avatar size="xs" icon={<FaRobot />} />}
                  size="sm"
                  flex="1"
                  justifyContent="flex-start"
                >
                  {agent.name}
                </Button>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMenu />}
                    size="sm"
                    variant="ghost"
                  />
                  <MenuList>
                    <MenuItem
                      icon={<FiEdit />}
                      onClick={() => onEditAgent(agent)}
                    >
                      Edit
                    </MenuItem>
                    <MenuItem
                      icon={<FiTrash />}
                      onClick={() => onDeleteAgent(agent)}
                    >
                      Delete
                    </MenuItem>
                    <MenuItem
                      icon={<FiUpload />}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.multiple = true;
                        fileInput.onchange = () =>
                          onUploadFile(agent, fileInput.files);
                        fileInput.click();
                      }}
                    >
                      Upload Files
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            ))
          )}
        </Collapse>

        {/* Collapsed Agent Icons */}
        {isSidebarCollapsed &&
          agents.map((agent) => (
            <Tooltip label={agent.name} key={agent.id} placement="right">
              <IconButton
                icon={<Avatar size="sm" icon={<FaRobot />} />}
                aria-label={agent.name}
                variant="ghost"
                size="sm"
                onClick={() => onAgentClick(agent)}
              />
            </Tooltip>
          ))}

        {/* Spacer */}
        <Box flex="1" />

        {/* Logout Button */}
        <Tooltip label="Logout" placement="right">
          <Button
            leftIcon={<FiLogOut />}
            colorScheme="red"
            variant="solid"
            onClick={onLogout}
            size="sm"
            w="100%"
            justifyContent={isSidebarCollapsed ? 'center' : 'flex-start'}
          >
            {!isSidebarCollapsed && 'Logout'}
          </Button>
        </Tooltip>
      </VStack>
    </Box>
  );
};

export default Sidebar;