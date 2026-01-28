import { Conversation, Participant, ConversationFolder } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'conversations',
  PARTICIPANTS: 'participants',
  CURRENT_CONVERSATION: 'current_conversation',
  FOLDERS: 'folders',
} as const;

export class ConversationStorage {
  // Conversations
  static saveConversation(conversation: Conversation): void {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(c => c.metadata.id === conversation.metadata.id);
    
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }

  static getAllConversations(): Conversation[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  }

  static getConversation(id: string): Conversation | null {
    const conversations = this.getAllConversations();
    return conversations.find(c => c.metadata.id === id) || null;
  }

  static deleteConversation(id: string): void {
    const conversations = this.getAllConversations();
    const filtered = conversations.filter(c => c.metadata.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));
  }

  static searchConversations(query: string): Conversation[] {
    const conversations = this.getAllConversations();
    const lowerQuery = query.toLowerCase();
    
    return conversations.filter(conv => {
      const metadata = conv.metadata;
      return (
        metadata.name.toLowerCase().includes(lowerQuery) ||
        metadata.participants.some(p => p.toLowerCase().includes(lowerQuery)) ||
        conv.content.toLowerCase().includes(lowerQuery) ||
        metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  // Participants
  static saveParticipant(participant: Participant): void {
    const participants = this.getAllParticipants();
    const index = participants.findIndex(p => p.id === participant.id);
    
    if (index >= 0) {
      participants[index] = participant;
    } else {
      participants.push(participant);
    }
    
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
  }

  static getAllParticipants(): Participant[] {
    const data = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    return data ? JSON.parse(data) : [];
  }

  static getParticipant(id: string): Participant | null {
    const participants = this.getAllParticipants();
    return participants.find(p => p.id === id) || null;
  }

  static deleteParticipant(id: string): void {
    const participants = this.getAllParticipants();
    const filtered = participants.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(filtered));
  }

  // Current conversation
  static getCurrentConversationId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
  }

  static setCurrentConversationId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
    }
  }

  // Folders
  static saveFolder(folder: ConversationFolder): void {
    const folders = this.getAllFolders();
    const index = folders.findIndex(f => f.path === folder.path);
    
    if (index >= 0) {
      folders[index] = folder;
    } else {
      folders.push(folder);
    }
    
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  }

  static getAllFolders(): ConversationFolder[] {
    const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    return data ? JSON.parse(data) : [];
  }
}
