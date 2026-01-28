export interface Participant {
  id: string;
  name: string;
  color: string;
}

export interface ConversationMessage {
  participantId: string;
  participantName: string;
  content: string;
  timestamp: number;
}

export interface ConversationMetadata {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  duration?: number; // en minutes
  participants: string[]; // IDs des participants
  status: 'active' | 'archived';
  folder?: string; // chemin du dossier (ex: "2024/01" ou "projet-x")
  type?: string; // "réunion", "appel", "interview", etc.
  tags?: string[];
}

export interface Conversation {
  metadata: ConversationMetadata;
  messages: ConversationMessage[];
  content: string; // contenu brut éditable
}

export interface ConversationFolder {
  path: string;
  name: string;
  type: 'year' | 'month' | 'project' | 'type' | 'custom';
}
