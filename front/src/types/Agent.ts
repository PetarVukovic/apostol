// src/types/Agent.ts

export interface FileInfo {
    id: number;
    name: string;
  }
  
  export interface Message {
    sender: 'user' | 'bot';
    text: string;
  }
  
  export interface Agent {
    id: number;
    name: string;
    prompt: string;
    files: FileInfo[];
    chatHistory: Message[];
  }