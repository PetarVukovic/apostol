// src/types/Agent.ts

export interface FileInfo {
    id: number;
    name: string;
  }
  
  export interface Message {
    sender: 'user' | 'bot';
    text: string;
  }
  
// types/Agent.ts

export interface Agent {
  id: number; // Ensure this matches the backend's agent_id
  name: string;
  prompt: string;
  chatHistory: Message[];
  files?: File[];
}