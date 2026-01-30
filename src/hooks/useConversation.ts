import { useState, useEffect, useCallback } from 'react';
import { Conversation, Participant } from '../types';
import { ConversationStorage } from '../utils/storage';
import { parseConversationContent, generateConversationName } from '../utils/conversationParser';

export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const allParticipants = ConversationStorage.getAllParticipants();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useConversation.ts:loadData',message:'Loading participants',data:{participantsCount:allParticipants.length,participantIds:allParticipants.map(p => p.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setParticipants(allParticipants);

      if (conversationId) {
        const conv = ConversationStorage.getConversation(conversationId);
        setConversation(conv);
      } else {
        // Créer une nouvelle conversation
        const newConv: Conversation = {
          metadata: {
            id: `conv_${Date.now()}`,
            name: generateConversationName(),
            date: new Date().toISOString().split('T')[0],
            participants: [],
            status: 'active',
          },
          messages: [],
          content: '',
        };
        setConversation(newConv);
        ConversationStorage.setCurrentConversationId(newConv.metadata.id);
      }
      setIsLoading(false);
    };

    loadData();
  }, [conversationId]);

  // Écouter les changements de participants (polling séparé)
  useEffect(() => {
    // Charger immédiatement au démarrage
    const currentParticipants = ConversationStorage.getAllParticipants();
    setParticipants(currentParticipants);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useConversation.ts:participants-polling-init',message:'Initial participants load',data:{count:currentParticipants.length,ids:currentParticipants.map(p => p.id),names:currentParticipants.map(p => p.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const interval = setInterval(() => {
      const currentParticipants = ConversationStorage.getAllParticipants();
      
      setParticipants(prev => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useConversation.ts:interval',message:'Polling participants',data:{currentCount:currentParticipants.length,currentIds:currentParticipants.map(p => p.id),currentNames:currentParticipants.map(p => p.name),storedCount:prev.length,storedIds:prev.map(p => p.id),storedNames:prev.map(p => p.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // Comparaison plus robuste : comparer les IDs et les noms
        const prevIds = prev.map(p => p.id).sort().join(',');
        const currentIds = currentParticipants.map(p => p.id).sort().join(',');
        const hasChanged = prevIds !== currentIds || prev.length !== currentParticipants.length;
        
        if (hasChanged) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useConversation.ts:interval',message:'Participants changed detected - UPDATING',data:{oldCount:prev.length,newCount:currentParticipants.length,oldIds:prev.map(p => p.id),newIds:currentParticipants.map(p => p.id),oldNames:prev.map(p => p.name),newNames:currentParticipants.map(p => p.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          return currentParticipants;
        }
        return prev;
      });
    }, 300); // Polling plus fréquent (300ms au lieu de 500ms)

    return () => clearInterval(interval);
  }, []);

  const updateContent = useCallback((content: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useConversation.ts:updateContent',message:'updateContent called',data:{hasConversation:!!conversation,conversationId:conversation?.metadata.id || null,content:content,contentLength:content.length,lineCount:content.split('\n').length,oldContent:conversation?.content || '',oldContentLength:conversation?.content?.length || 0,participantsCount:participants.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    if (!conversation) return;

    // Protection: ne pas sauvegarder un contenu vide si la conversation a déjà du contenu
    // Cela évite la perte accidentelle de données
    const oldContentLength = conversation.content?.length || 0;
    const newContentLength = content.length;
    
    if (oldContentLength > 0 && newContentLength === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useConversation.ts:updateContent',message:'BLOCKED: Preventing save of empty content when conversation has content',data:{oldContentLength:oldContentLength,newContentLength:newContentLength},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      console.warn('Tentative de sauvegarder un contenu vide alors que la conversation contient déjà du contenu. Sauvegarde bloquée pour éviter la perte de données.');
      return; // Ne pas sauvegarder
    }

    const updated = {
      ...conversation,
      content,
      messages: parseConversationContent(content, participants),
    };

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useConversation.ts:updateContent',message:'Saving conversation',data:{conversationId:updated.metadata.id,content:updated.content,contentLength:updated.content.length,lineCount:updated.content.split('\n').length,messagesCount:updated.messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    setConversation(updated);
    ConversationStorage.saveConversation(updated);
  }, [conversation, participants]);

  const saveConversation = useCallback(() => {
    if (!conversation) return;

    ConversationStorage.saveConversation(conversation);
  }, [conversation]);

  const addParticipant = useCallback((participant: Participant) => {
    ConversationStorage.saveParticipant(participant);
    setParticipants(prev => {
      const exists = prev.find(p => p.id === participant.id);
      if (exists) {
        return prev.map(p => p.id === participant.id ? participant : p);
      }
      return [...prev, participant];
    });
  }, []);

  return {
    conversation,
    participants,
    isLoading,
    updateContent,
    saveConversation,
    addParticipant,
    setConversation,
  };
}
