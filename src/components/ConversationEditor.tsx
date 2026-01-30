import { useState, useEffect, useRef, useCallback } from 'react';
import { Participant } from '../types';
import { useConversation } from '../hooks/useConversation';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import './ConversationEditor.css';

interface ConversationEditorProps {
  conversationId: string | null;
  onSave?: () => void;
  onNewConversation?: () => void;
}

export function ConversationEditor({ conversationId, onSave, onNewConversation }: ConversationEditorProps) {
  const { conversation, participants, updateContent, saveConversation } = useConversation(conversationId);
  const [content, setContent] = useState('');
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [currentParticipantText, setCurrentParticipantText] = useState('');
  const [uiError, setUiError] = useState<string | null>(null);
  const [speechLanguage, setSpeechLanguage] = useState<'fr-FR' | 'en-US' | 'auto'>('auto');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const lastParticipantRef = useRef<Participant | null>(null);
  const lastContentRef = useRef<string>('');
  const participantJustChangedRef = useRef<boolean>(false);
  const contentLengthRef = useRef<number>(0);
  
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    isStuck,
    detectedLanguage,
    startListening,
    stopListening,
    resetTranscript,
    clearError,
    forceLanguage,
  } = useSpeechRecognition(speechLanguage);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:useEffect-conversation',message:'Conversation changed',data:{conversationId:conversation?.metadata.id || null,conversationContent:conversation?.content || '',conversationContentLength:conversation?.content?.length || 0,currentContentLength:contentLengthRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (conversation) {
      // Protection: ne pas écraser un contenu non vide avec un contenu vide
      // Cela peut arriver si la conversation est rechargée avec un contenu vide
      const currentContentLength = contentLengthRef.current;
      const shouldUpdate = conversation.content !== content && 
                          !(currentContentLength > 0 && conversation.content.length === 0);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:useEffect-conversation',message:'Setting content from conversation',data:{conversationContent:conversation.content,conversationContentLength:conversation.content.length,currentContentLength:currentContentLength,willOverwrite:conversation.content !== content,shouldUpdate:shouldUpdate,wouldLoseData:currentContentLength > 0 && conversation.content.length === 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (shouldUpdate) {
        setContent(conversation.content);
        contentLengthRef.current = conversation.content.length;
      } else if (currentContentLength > 0 && conversation.content.length === 0) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:useEffect-conversation',message:'BLOCKED: Preventing empty content from overwriting non-empty content',data:{currentContentLength:currentContentLength,conversationContentLength:conversation.content.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }
    }
  }, [conversation]);

  // #region agent log
  // Auto-select first participant if none selected
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:useEffect-participants',message:'Participants loaded',data:{participantsCount:participants.length,currentParticipantId:currentParticipant?.id || null,firstParticipantId:participants[0]?.id || null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    
    if (participants.length > 0 && !currentParticipant) {
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:useEffect-participants',message:'Auto-selecting first participant',data:{selectedParticipantId:participants[0].id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      setCurrentParticipant(participants[0]);
      lastParticipantRef.current = participants[0];
    }
  }, [participants, currentParticipant]);
  // #endregion

  // Gérer la transcription vocale
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect-entry',message:'Transcription effect triggered',data:{isListening:isListening,hasCurrentParticipant:!!currentParticipant,transcript:transcript,interimTranscript:interimTranscript,transcriptLength:transcript.length,interimLength:interimTranscript.length,participantJustChanged:participantJustChangedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!isListening || !currentParticipant) {
      setCurrentParticipantText('');
      participantJustChangedRef.current = false;
      return;
    }

    // Séparer le transcript final (qui ne change plus) et l'interim (qui change)
    const finalText = transcript.trim();
    const interimText = interimTranscript.trim();
    const displayText = (finalText + ' ' + interimText).trim();
    setCurrentParticipantText(displayText);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Calculated displayText',data:{finalText:finalText,interimText:interimText,displayText:displayText,displayTextLength:displayText.length,isEmpty:!displayText,participantJustChanged:participantJustChangedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Si le participant vient juste de changer, ignorer l'effet jusqu'à ce que les transcripts soient vides
    // Cela évite de créer une ligne avec l'ancien texte
    // MAIS: ne pas bloquer trop longtemps pour éviter que la transcription ne fonctionne plus
    if (participantJustChangedRef.current && displayText) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Participant just changed - checking if should skip',data:{finalText:finalText,interimText:interimText,displayText:displayText,displayTextLength:displayText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      
      // Si le displayText est très court (probablement l'ancien texte résiduel), l'ignorer
      // Mais si c'est long, c'est probablement du nouveau texte, donc ne pas bloquer
      if (displayText.length < 10) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Skipping update - participant just changed and displayText is short (old text)',data:{finalText:finalText,interimText:interimText,displayText:displayText},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
        // Réinitialiser le flag une fois que les transcripts sont vides
        if (!finalText && !interimText) {
          participantJustChangedRef.current = false;
        }
        return;
      } else {
        // Le texte est long, c'est probablement du nouveau texte, donc réinitialiser le flag et continuer
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Participant changed but displayText is long - resetting flag and continuing',data:{displayText:displayText,displayTextLength:displayText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'N'})}).catch(()=>{});
        // #endregion
        participantJustChangedRef.current = false;
      }
    }

    // Ne pas créer de ligne si le texte est vide (évite les lignes vides au changement de participant)
    if (!displayText) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Skipping update - displayText is empty',data:{finalText:finalText,interimText:interimText},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Processing transcription',data:{participantId:currentParticipant.id,participantName:currentParticipant.name,finalText:finalText,interimText:interimText,displayText:displayText},timestamp:Date.now(),sessionId:'debug-session',runId:'run7',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    // Utiliser setContent avec une fonction pour éviter les problèmes de closure et de duplication
    setContent(prevContent => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Updating content',data:{prevContentLength:prevContent.length,prevContentLines:prevContent.split('\n').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run7',hypothesisId:'N'})}).catch(()=>{});
      // #endregion

      const lines = prevContent.split('\n');
      let lastParticipantLineIndex = -1;
      
      // Trouver la dernière ligne de ce participant
      for (let i = lines.length - 1; i >= 0; i--) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith(`${currentParticipant.name}:`)) {
          lastParticipantLineIndex = i;
          break;
        }
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Found participant line',data:{lastParticipantLineIndex:lastParticipantLineIndex,prevContentLength:prevContent.length,lastLineIsCurrentParticipant:lastParticipantLineIndex === lines.length - 1},timestamp:Date.now(),sessionId:'debug-session',runId:'run7',hypothesisId:'K'})}).catch(()=>{});
      // #endregion

      let newContent = '';
      
      // Si la dernière ligne du document est déjà ce participant, on la met à jour
      // Sinon, on ajoute une nouvelle ligne à la fin
      const lastLineIsCurrentParticipant = lastParticipantLineIndex === lines.length - 1 && lastParticipantLineIndex >= 0;
      
      if (lastLineIsCurrentParticipant) {
        // Mettre à jour la ligne existante (même participant continue de parler)
        const beforeLines = lines.slice(0, lastParticipantLineIndex);
        const oldLine = lines[lastParticipantLineIndex];
        const updatedLine = `${currentParticipant.name}: ${displayText}`;
        newContent = [...beforeLines, updatedLine].join('\n');
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Updating existing line',data:{lineIndex:lastParticipantLineIndex,oldLine:oldLine,updatedLine:updatedLine,displayText:displayText,displayTextLength:displayText.length,linesBefore:beforeLines.length,newContentLength:newContent.length,newContentLines:newContent.split('\n').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run8',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
      } else {
        // Ajouter une nouvelle ligne à la fin (nouveau participant ou changement de participant)
        // Vérifier qu'on n'ajoute pas une ligne qui existe déjà
        const lastLine = lines[lines.length - 1] || '';
        const isLastLineThisParticipant = lastLine.trim().startsWith(`${currentParticipant.name}:`);
        
        if (isLastLineThisParticipant) {
          // Mettre à jour la dernière ligne si c'est ce participant
          const beforeLines = lines.slice(0, lines.length - 1);
          const oldLine = lines[lines.length - 1];
          const updatedLine = `${currentParticipant.name}: ${displayText}`;
          newContent = [...beforeLines, updatedLine].join('\n');
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Updating last line (not lastParticipantLineIndex)',data:{oldLine:oldLine,updatedLine:updatedLine,displayText:displayText,displayTextLength:displayText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run8',hypothesisId:'J'})}).catch(()=>{});
          // #endregion
        } else {
          // Ajouter une nouvelle ligne
          const needsNewLine = prevContent.length > 0 && !prevContent.endsWith('\n');
          const newLine = `${currentParticipant.name}: ${displayText}`;
          newContent = prevContent + (needsNewLine ? '\n' : '') + newLine;
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Adding new line at end',data:{prevContentLength:prevContent.length,isLastLineThisParticipant:isLastLineThisParticipant,newContentLength:newContent.length,newContentLines:newContent.split('\n').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run7',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
      }

      // Mettre à jour la référence après avoir calculé le nouveau contenu
      lastContentRef.current = newContent;
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:transcription-effect',message:'Returning new content from transcription',data:{prevContentLength:prevContent.length,newContentLength:newContent.length,prevLineCount:prevContent.split('\n').length,newLineCount:newContent.split('\n').length,isEmpty:!newContent},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      return newContent;
    });
  }, [transcript, interimTranscript, currentParticipant, isListening]);

  // Mettre à jour la référence du contenu quand il change (hors transcription)
  // Cette référence est utilisée pour éviter les boucles infinies, mais on l'utilise avec précaution
  useEffect(() => {
    contentLengthRef.current = content.length;
    if (!isListening) {
      lastContentRef.current = content;
    }
  }, [content, isListening]);

  // Auto-save après 2 secondes d'inactivité
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = window.setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:auto-save',message:'Auto-save triggered',data:{content:content,contentLength:content.length,conversationContent:conversation?.content || '',conversationContentLength:conversation?.content?.length || 0,isDifferent:content !== conversation?.content,lineCount:content.split('\n').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (content !== conversation?.content) {
        // Protection: ne pas sauvegarder un contenu vide si la conversation a déjà du contenu
        const oldContentLength = conversation?.content?.length || 0;
        const newContentLength = content.length;
        
        if (oldContentLength > 0 && newContentLength === 0) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:auto-save',message:'BLOCKED: Auto-save prevented - empty content would overwrite non-empty',data:{oldContentLength:oldContentLength,newContentLength:newContentLength},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
          console.warn('Auto-save bloqué: tentative de sauvegarder un contenu vide alors que la conversation contient déjà du contenu.');
          return; // Ne pas sauvegarder
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:auto-save',message:'Calling updateContent',data:{content:content,contentLength:content.length,lineCount:content.split('\n').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        updateContent(content);
        if (onSave) onSave();
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, conversation, updateContent, onSave]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleContentChange',message:'Content changed manually',data:{oldContentLength:content.length,newContentLength:newContent.length,oldLineCount:content.split('\n').length,newLineCount:newContent.split('\n').length,isEmpty:!newContent},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    setContent(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Détection du changement de participant avec ":" ou " :"
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const lastLine = lines[lines.length - 1] || '';

      // Vérifier si la ligne commence par un nom de participant suivi de ":"
      const participantMatch = participants.find(p => {
        const trimmed = lastLine.trim();
        return trimmed === `${p.name}:` || trimmed === `${p.name} :` || 
               trimmed.startsWith(`${p.name}:`) || trimmed.startsWith(`${p.name} :`);
      });

      if (participantMatch && lastLine.trim().endsWith(':')) {
        e.preventDefault();
        // Insérer une nouvelle ligne
        const textAfter = textarea.value.substring(cursorPos);
        const newContent = textBeforeCursor + '\n' + textAfter;
        setContent(newContent);
        
        // Positionner le curseur sur la nouvelle ligne
        setTimeout(() => {
          const newCursorPos = cursorPos + 1;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
  };

  const switchParticipant = useCallback((participant: Participant) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:switchParticipant',message:'Switch participant called',data:{newParticipantId:participant.id,newParticipantName:participant.name,currentParticipantId:currentParticipant?.id || null,isListening:isListening,transcriptLength:transcript.length,interimLength:interimTranscript.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    // Si on change de participant pendant l'enregistrement, finaliser le texte actuel
    if (isListening && lastParticipantRef.current && (transcript || interimTranscript)) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:switchParticipant',message:'Finalizing current transcript before switch',data:{transcript:transcript,interimTranscript:interimTranscript},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      // Finaliser le texte du participant actuel dans le contenu
      const finalText = (transcript + ' ' + interimTranscript).trim();
      if (finalText && lastParticipantRef.current) {
        setContent(prevContent => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:switchParticipant',message:'Finalizing content',data:{prevContentLength:prevContent.length,prevContentLines:prevContent.split('\n').length,finalText:finalText},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'O'})}).catch(()=>{});
          // #endregion

          const lines = prevContent.split('\n');
          let lastLineIndex = -1;
          
          // Trouver la dernière ligne du participant actuel
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim().startsWith(`${lastParticipantRef.current!.name}:`)) {
              lastLineIndex = i;
              break;
            }
          }
          
          let finalizedContent = prevContent;
          if (lastLineIndex >= 0) {
            // Si c'est la dernière ligne, la mettre à jour avec le texte finalisé
            if (lastLineIndex === lines.length - 1) {
              const beforeLines = lines.slice(0, lastLineIndex);
              const updatedLine = `${lastParticipantRef.current!.name}: ${finalText}`;
              finalizedContent = [...beforeLines, updatedLine].join('\n');
            }
          }
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:switchParticipant',message:'Content finalized',data:{finalizedContentLength:finalizedContent.length,finalizedContentLines:finalizedContent.split('\n').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'P'})}).catch(()=>{});
          // #endregion
          
          lastContentRef.current = finalizedContent;
          return finalizedContent;
        });
      }
    }
    
    // Ne réinitialiser la transcription QUE si l'enregistrement est en cours
    // Si l'enregistrement n'est pas en cours, on ne veut pas perdre les transcripts
    if (isListening) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:switchParticipant',message:'Resetting transcript because recording is active',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      resetTranscript();
      // Marquer que le participant vient juste de changer
      participantJustChangedRef.current = true;
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:switchParticipant',message:'NOT resetting transcript - recording not active',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'P'})}).catch(()=>{});
      // #endregion
      participantJustChangedRef.current = false;
    }
    
    // Toujours mettre à jour la référence du contenu après le changement de participant
    setContent(currentContent => {
      lastContentRef.current = currentContent;
      return currentContent;
    });
    
    setCurrentParticipant(participant);
    lastParticipantRef.current = participant;
    setCurrentParticipantText('');
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:switchParticipant',message:'New participant set',data:{participantId:participant.id,participantName:participant.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
  }, [isListening, resetTranscript, currentParticipant, transcript, interimTranscript]);

  const handleToggleRecording = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleToggleRecording',message:'Toggle recording called',data:{isListening:isListening,hasCurrentParticipant:!!currentParticipant,participantsLength:participants.length,isSupported:isSupported,error:error,isStuck:isStuck},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (isListening) {
      // Finaliser le contenu avant d'arrêter
      if (currentParticipant && (transcript || interimTranscript)) {
        const finalText = (transcript + ' ' + interimTranscript).trim();
        if (finalText) {
          const baseContent = lastContentRef.current || content;
          const lines = baseContent.split('\n');
          let lastParticipantLineIndex = -1;
          
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim().startsWith(`${currentParticipant.name}:`)) {
              lastParticipantLineIndex = i;
              break;
            }
          }

          let finalContent = '';
          if (lastParticipantLineIndex >= 0) {
            const beforeLines = lines.slice(0, lastParticipantLineIndex);
            const afterLines = lines.slice(lastParticipantLineIndex + 1);
            const updatedLine = `${currentParticipant.name}: ${finalText}`;
            finalContent = [...beforeLines, updatedLine, ...afterLines].join('\n');
          } else {
            const needsNewLine = baseContent.length > 0 && !baseContent.endsWith('\n');
            finalContent = baseContent + (needsNewLine ? '\n' : '') + `${currentParticipant.name}: ${finalText}`;
          }
          
          setContent(finalContent);
          lastContentRef.current = finalContent;
        }
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleToggleRecording',message:'Stopping recording',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      stopListening();
      resetTranscript();
      setCurrentParticipantText('');
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleToggleRecording',message:'Starting recording',data:{hasCurrentParticipant:!!currentParticipant,participantsLength:participants.length,isSupported:isSupported},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (!currentParticipant) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleToggleRecording',message:'BLOCKED: No current participant',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setUiError('Veuillez sélectionner un participant avant de démarrer l\'enregistrement.');
        setTimeout(() => setUiError(null), 5000);
        return;
      }
      if (participants.length === 0) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleToggleRecording',message:'BLOCKED: No participants',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        setUiError('Veuillez ajouter au moins un participant avant de démarrer.');
        setTimeout(() => setUiError(null), 5000);
        return;
      }
      if (!isSupported) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleToggleRecording',message:'BLOCKED: Speech recognition not supported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        setUiError('La reconnaissance vocale n\'est pas supportée dans ce navigateur.');
        setTimeout(() => setUiError(null), 5000);
        return;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleToggleRecording',message:'Calling startListening',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      lastContentRef.current = content;
      // Ne pas réinitialiser les transcripts au démarrage - ils sont déjà vides
      // resetTranscript(); // Commenté pour éviter de perdre les premiers résultats
      setCurrentParticipantText('');
      participantJustChangedRef.current = false; // S'assurer que le flag est réinitialisé
      startListening();
    }
  }, [isListening, currentParticipant, participants.length, content, transcript, interimTranscript, stopListening, startListening, resetTranscript, isSupported]);

  const handleManualSave = () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:handleManualSave',message:'Manual save triggered',data:{content:content,contentLength:content.length,lineCount:content.split('\n').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run11',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Sauvegarder immédiatement
    updateContent(content);
    saveConversation();
    if (onSave) onSave();
    
    // Afficher un message de confirmation
    const originalError = uiError;
    setUiError('✅ Conversation sauvegardée avec succès');
    setTimeout(() => {
      setUiError(originalError);
    }, 2000);
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // Afficher un message de confirmation temporaire
      const originalError = uiError;
      setUiError('✅ Contenu copié dans le presse-papiers');
      setTimeout(() => {
        setUiError(originalError);
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      setUiError('❌ Erreur lors de la copie');
      setTimeout(() => setUiError(null), 3000);
    }
  };

  const handleClearTranscripts = () => {
    resetTranscript();
    setCurrentParticipantText('');
    // Afficher un message de confirmation temporaire
    const originalError = uiError;
    setUiError('✅ Transcripts vidés');
    setTimeout(() => {
      setUiError(originalError);
    }, 2000);
  };

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:render',message:'Button disabled state check',data:{participantsLength:participants.length,currentParticipant:currentParticipant?.id || null,isDisabled:!currentParticipant || participants.length === 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, [participants.length, currentParticipant]);
  // #endregion

  if (!conversation) {
    return <div className="conversation-editor-loading">Chargement...</div>;
  }

  if (!isSupported) {
    return (
      <div className="conversation-editor">
        <div className="error-banner">
          <p>⚠️ {error || 'La reconnaissance vocale n\'est pas supportée'}</p>
          <p className="error-hint">
            Veuillez utiliser Chrome, Edge ou Safari pour utiliser cette fonctionnalité.
          </p>
        </div>
      </div>
    );
  }

  // Transcription intermédiaire supprimée - le texte apparaît directement dans le textarea

  return (
    <div className="conversation-editor">
      <div className="conversation-editor-header">
        <h2>{conversation.metadata.name}</h2>
        <div className="conversation-editor-actions">
          {onNewConversation && (
            <button onClick={onNewConversation} className="btn-new-recording">
              ➕ Nouvel enregistrement
            </button>
          )}
          <button onClick={handleCopyContent} className="btn-copy" title="Copier tout le contenu">
            📋 Copier
          </button>
          <button onClick={handleClearTranscripts} className="btn-clear" title="Vider les transcripts">
            🗑️ Vider transcripts
          </button>
          <button onClick={handleManualSave} className="btn-save" title="Sauvegarder immédiatement">
            💾 Sauvegarder maintenant
          </button>
        </div>
      </div>

      {(error || uiError) && (
        <div className={`error-banner ${isStuck ? 'stuck' : ''}`}>
          <span>
            {isStuck && '🔴 '}
            {error || uiError}
          </span>
          <button 
            onClick={() => { clearError(); setUiError(null); }} 
            className="btn-close-error"
          >
            ✕
          </button>
        </div>
      )}
      
      {isStuck && isListening && (
        <div className="stuck-notification">
          <strong>⚠️ Attention :</strong> L'enregistrement est bloqué. 
          Vérifiez votre microphone et vos permissions, puis cliquez sur "Réessayer".
        </div>
      )}

      <div className="recording-controls">
        <div className="participant-selector">
          <label>Participant actuel :</label>
          {/* #region agent log */}
          {(() => {
            fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConversationEditor.tsx:render-participants',message:'Rendering participants',data:{participantsCount:participants.length,participantIds:participants.map(p => p.id),participantNames:participants.map(p => p.name),hasCurrentParticipant:!!currentParticipant,currentParticipantId:currentParticipant?.id || null},timestamp:Date.now(),sessionId:'debug-session',runId:'run13',hypothesisId:'C'})}).catch(()=>{});
            return null;
          })()}
          {/* #endregion */}
          {participants.length === 0 ? (
            <span className="no-participants-warning">
              ⚠️ Ajoutez d'abord des participants
            </span>
          ) : (
            <div className="participant-buttons">
              {participants.map(participant => (
                <button
                  key={participant.id}
                  onClick={() => switchParticipant(participant)}
                  className={`btn-participant-select ${
                    currentParticipant?.id === participant.id ? 'active' : ''
                  }`}
                  style={{
                    borderColor: participant.color,
                    backgroundColor: currentParticipant?.id === participant.id
                      ? `${participant.color}20`
                      : 'white',
                  }}
                  disabled={false}
                >
                  {participant.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="language-selector">
          <label>Langue de transcription :</label>
          <div className="language-buttons">
            <button
              onClick={() => setSpeechLanguage('auto')}
              className={`btn-language ${speechLanguage === 'auto' ? 'active' : ''}`}
            >
              🔄 Auto (FR/EN)
            </button>
            <button
              onClick={() => setSpeechLanguage('fr-FR')}
              className={`btn-language ${speechLanguage === 'fr-FR' ? 'active' : ''}`}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => setSpeechLanguage('en-US')}
              className={`btn-language ${speechLanguage === 'en-US' ? 'active' : ''}`}
            >
              🇬🇧 English
            </button>
          </div>
          {speechLanguage === 'auto' && isListening && detectedLanguage && (
            <div className="detected-language">
              <span>Langue détectée : {detectedLanguage === 'fr-FR' ? '🇫🇷 Français' : '🇬🇧 English'}</span>
              <div className="language-correction-buttons">
                <button
                  onClick={() => forceLanguage('fr-FR')}
                  className="btn-correct-language"
                  disabled={detectedLanguage === 'fr-FR'}
                  title="Forcer le français"
                >
                  🇫🇷 Forcer FR
                </button>
                <button
                  onClick={() => forceLanguage('en-US')}
                  className="btn-correct-language"
                  disabled={detectedLanguage === 'en-US'}
                  title="Forcer l'anglais"
                >
                  🇬🇧 Force EN
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="recording-buttons">
          <button
            onClick={handleToggleRecording}
            className={`btn-record ${
              isListening 
                ? (isStuck ? 'stuck' : 'recording') 
                : ''
            }`}
            disabled={!currentParticipant || participants.length === 0}
            title={isStuck ? '⚠️ Enregistrement bloqué - Cliquez pour réessayer' : ''}
          >
            {isListening ? (
              <>
                <span className={`recording-indicator ${isStuck ? 'stuck' : ''}`}>●</span>
                {isStuck ? '⚠️ Enregistrement bloqué' : 'Arrêter l\'enregistrement'}
              </>
            ) : (
              <>
                🎤 Démarrer l'enregistrement
              </>
            )}
          </button>
          {isStuck && (
            <button
              onClick={() => {
                stopListening();
                setTimeout(() => {
                  if (currentParticipant) {
                    startListening();
                  }
                }, 500);
              }}
              className="btn-restart"
              title="Réessayer l'enregistrement"
            >
              🔄 Réessayer
            </button>
          )}
        </div>
      </div>

      <div className="conversation-display">
        <div className="conversation-textarea-container">
          <textarea
            ref={textareaRef}
            className="conversation-textarea"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="La transcription apparaîtra ici lors de l'enregistrement vocal..."
            readOnly={false}
          />
        </div>
      </div>
    </div>
  );
}
