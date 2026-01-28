import { ConversationMessage, Participant } from '../types';

/**
 * Parse le contenu brut d'une conversation en messages structurés
 */
export function parseConversationContent(
  content: string,
  participants: Participant[]
): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  const lines = content.split('\n');
  
  let currentParticipant: Participant | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    // Chercher si la ligne commence par un nom de participant
    const participantMatch = participants.find(p => 
      line.trim().startsWith(p.name + ':') || 
      line.trim().startsWith(p.name + ' :')
    );
    
    if (participantMatch) {
      // Sauvegarder le message précédent s'il existe
      if (currentParticipant && currentContent.length > 0) {
        messages.push({
          participantId: currentParticipant.id,
          participantName: currentParticipant.name,
          content: currentContent.join('\n').trim(),
          timestamp: Date.now(),
        });
        currentContent = [];
      }
      
      currentParticipant = participantMatch;
      const contentStart = line.indexOf(':') + 1;
      const messageContent = line.substring(contentStart).trim();
      if (messageContent) {
        currentContent.push(messageContent);
      }
    } else if (currentParticipant) {
      // Continuer le message du participant actuel
      currentContent.push(line);
    }
  }
  
  // Ajouter le dernier message
  if (currentParticipant && currentContent.length > 0) {
    messages.push({
      participantId: currentParticipant.id,
      participantName: currentParticipant.name,
      content: currentContent.join('\n').trim(),
      timestamp: Date.now(),
    });
  }
  
  return messages;
}

/**
 * Génère un nom de conversation structuré
 */
export function generateConversationName(
  type?: string,
  participants?: string[]
): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const parts: string[] = [dateStr];
  
  if (type) {
    parts.push(type);
  }
  
  if (participants && participants.length > 0) {
    parts.push(participants.slice(0, 3).join('_'));
  }
  
  return parts.join('_');
}
