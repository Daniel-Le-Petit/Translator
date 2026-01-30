import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export type SpeechLanguage = 'fr-FR' | 'en-US' | 'auto';

export function useSpeechRecognition(language: SpeechLanguage = 'auto') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [detectedLanguage, setDetectedLanguage] = useState<'fr-FR' | 'en-US'>('fr-FR');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recognitionFRRef = useRef<SpeechRecognition | null>(null);
  const recognitionENRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const stuckCheckIntervalRef = useRef<number | null>(null);
  const autoRestartTimeoutRef = useRef<number | null>(null);
  const networkRetryCountRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);
  const isStuckRef = useRef<boolean>(false);
  const languageScoresRef = useRef<{ fr: number; en: number }>({ fr: 0, en: 0 });
  const activeRecognitionRef = useRef<'fr' | 'en' | null>(null);
  const frTranscriptRef = useRef<string>('');
  const enTranscriptRef = useRef<string>('');
  const frInterimRef = useRef<string>('');
  const enInterimRef = useRef<string>('');

  useEffect(() => {
    // Vérifier si l'API est supportée
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('La reconnaissance vocale n\'est pas supportée par votre navigateur. Veuillez utiliser Chrome, Edge ou Safari.');
      return;
    }

    setIsSupported(true);
    
    try {
      const actualLanguage = language === 'auto' ? 'fr-FR' : language;
      
      // Si mode auto, créer deux reconnaissances
      if (language === 'auto') {
        const recognitionFR = new SpeechRecognition();
        recognitionFR.continuous = true;
        recognitionFR.interimResults = true;
        recognitionFR.lang = 'fr-FR';

        const recognitionEN = new SpeechRecognition();
        recognitionEN.continuous = true;
        recognitionEN.interimResults = true;
        recognitionEN.lang = 'en-US';

        // Réinitialiser les transcripts
        frTranscriptRef.current = '';
        enTranscriptRef.current = '';
        frInterimRef.current = '';
        enInterimRef.current = '';

        const updateBestResult = () => {
          // Si une langue a été forcée, l'utiliser et mettre à jour les transcripts
          if (activeRecognitionRef.current === 'fr') {
            setDetectedLanguage('fr-FR');
            // Ne pas changer les transcripts si la langue est forcée
            return;
          } else if (activeRecognitionRef.current === 'en') {
            setDetectedLanguage('en-US');
            // Ne pas changer les transcripts si la langue est forcée
            return;
          }
          
          // Sinon, utiliser le meilleur score pour déterminer la langue
          const frScore = languageScoresRef.current.fr;
          const enScore = languageScoresRef.current.en;
          
          if (frScore > enScore || (frScore === enScore && activeRecognitionRef.current === 'fr')) {
            if (activeRecognitionRef.current !== 'fr') {
              activeRecognitionRef.current = 'fr';
              setDetectedLanguage('fr-FR');
            }
          } else {
            if (activeRecognitionRef.current !== 'en') {
              activeRecognitionRef.current = 'en';
              setDetectedLanguage('en-US');
            }
          }
        };

        recognitionFR.onresult = (event: SpeechRecognitionEvent) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionFR.onresult',message:'FR onresult called',data:{resultIndex:event.resultIndex,resultsLength:event.results.length,isListeningRef:isListeningRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'Q'})}).catch(()=>{});
          // #endregion
          
          let interim = '';
          let final = '';
          let totalConfidence = 0;
          let count = 0;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const alt = result[0];
            if (alt) {
              totalConfidence += alt.confidence || 0.5;
              count++;
              if (result.isFinal) {
                final += alt.transcript + ' ';
              } else {
                interim += alt.transcript;
              }
            }
          }

          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionFR.onresult',message:'FR results processed',data:{final:final,interim:interim,count:count,totalConfidence:totalConfidence},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'R'})}).catch(()=>{});
          // #endregion

          if (count > 0) {
            languageScoresRef.current.fr = totalConfidence / count;
          }

          if (final) {
            frTranscriptRef.current += final;
            finalTranscriptRef.current = frTranscriptRef.current;
          }
          frInterimRef.current = interim;
          
          // Mettre à jour les transcripts selon la langue active AVANT updateBestResult
          if (activeRecognitionRef.current === 'fr' || 
              (activeRecognitionRef.current === null && languageScoresRef.current.fr >= languageScoresRef.current.en)) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionFR.onresult',message:'Setting transcripts from FR',data:{frTranscript:frTranscriptRef.current,frInterim:frInterimRef.current,frTranscriptLength:frTranscriptRef.current.length,frInterimLength:frInterimRef.current.length,activeRecognition:activeRecognitionRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            setTranscript(frTranscriptRef.current);
            setInterimTranscript(frInterimRef.current);
          }
          
          updateBestResult();
          setLastActivityTime(Date.now());
          setIsStuck(false);
        };

        recognitionEN.onresult = (event: SpeechRecognitionEvent) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionEN.onresult',message:'EN onresult called',data:{resultIndex:event.resultIndex,resultsLength:event.results.length,isListeningRef:isListeningRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'S'})}).catch(()=>{});
          // #endregion
          
          let interim = '';
          let final = '';
          let totalConfidence = 0;
          let count = 0;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const alt = result[0];
            if (alt) {
              totalConfidence += alt.confidence || 0.5;
              count++;
              if (result.isFinal) {
                final += alt.transcript + ' ';
              } else {
                interim += alt.transcript;
              }
            }
          }

          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionEN.onresult',message:'EN results processed',data:{final:final,interim:interim,count:count,totalConfidence:totalConfidence},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'T'})}).catch(()=>{});
          // #endregion

          if (count > 0) {
            languageScoresRef.current.en = totalConfidence / count;
          }

          if (final) {
            enTranscriptRef.current += final;
          }
          enInterimRef.current = interim;
          
          // Mettre à jour les transcripts selon la langue active AVANT updateBestResult
          if (activeRecognitionRef.current === 'en' || 
              (activeRecognitionRef.current === null && languageScoresRef.current.en > languageScoresRef.current.fr)) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionEN.onresult',message:'Setting transcripts from EN',data:{enTranscript:enTranscriptRef.current,enInterim:enInterimRef.current,enTranscriptLength:enTranscriptRef.current.length,enInterimLength:enInterimRef.current.length,activeRecognition:activeRecognitionRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            setTranscript(enTranscriptRef.current);
            setInterimTranscript(enInterimRef.current);
          }
          
          updateBestResult();
          setLastActivityTime(Date.now());
          setIsStuck(false);
        };

        const handleError = (event: SpeechRecognitionErrorEvent, _lang: string) => {
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return; // Ignorer
          }
          console.error('Erreur reconnaissance vocale:', event.error, event.message);
          let errorMessage = 'Erreur de reconnaissance vocale';
          switch (event.error) {
            case 'audio-capture':
              errorMessage = 'Aucun microphone détecté. Vérifiez vos permissions.';
              break;
            case 'not-allowed':
              errorMessage = "Permission d'accès au microphone refusée. Autorisez le micro dans les paramètres du navigateur.";
              break;
            case 'network':
              errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
              break;
            default:
              errorMessage = `Erreur: ${event.error}. Réessayez.`;
          }
          setError(errorMessage);
          isListeningRef.current = false;
          setIsListening(false);
          isStuckRef.current = true;
          setIsStuck(true);
        };

        recognitionFR.onerror = (e) => handleError(e, 'FR');
        recognitionEN.onerror = (e) => handleError(e, 'EN');

        recognitionFR.onstart = () => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionFR.onstart',message:'FR recognition started',data:{isListeningRef:isListeningRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'N'})}).catch(()=>{});
          // #endregion
          isListeningRef.current = true;
          setIsListening(true);
          setIsStuck(false);
          setError(null);
          setLastActivityTime(Date.now());
        };

        recognitionEN.onstart = () => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionEN.onstart',message:'EN recognition started',data:{isListeningRef:isListeningRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'O'})}).catch(()=>{});
          // #endregion
          isListeningRef.current = true;
          setIsListening(true);
          setIsStuck(false);
          setError(null);
          setLastActivityTime(Date.now());
        };

        recognitionFR.onend = () => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionFR.onend',message:'FR recognition ended',data:{isListeningRef:isListeningRef.current,isStuckRef:isStuckRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          if (isListeningRef.current && !isStuckRef.current) {
            setTimeout(() => {
              try {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionFR.onend',message:'Restarting FR recognition',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                recognitionFR.start();
              } catch (e: any) {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionFR.onend',message:'ERROR restarting FR',data:{error:e?.message || String(e),errorName:e?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.error('Erreur lors du redémarrage FR:', e);
                isStuckRef.current = true;
                setIsStuck(true);
              }
            }, 300);
          }
        };

        recognitionEN.onend = () => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionEN.onend',message:'EN recognition ended',data:{isListeningRef:isListeningRef.current,isStuckRef:isStuckRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          if (isListeningRef.current && !isStuckRef.current) {
            setTimeout(() => {
              try {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionEN.onend',message:'Restarting EN recognition',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
                recognitionEN.start();
              } catch (e: any) {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognitionEN.onend',message:'ERROR restarting EN',data:{error:e?.message || String(e),errorName:e?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'F'})}).catch(()=>{});
                // #endregion
                console.error('Erreur lors du redémarrage EN:', e);
                isStuckRef.current = true;
                setIsStuck(true);
              }
            }, 300);
          }
        };

        recognitionFRRef.current = recognitionFR;
        recognitionENRef.current = recognitionEN;
        recognitionRef.current = recognitionFR; // Par défaut
      } else {
        // Mode langue fixe
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = actualLanguage;

        recognition.onstart = () => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onstart',message:'Recognition started (fixed language)',data:{language:actualLanguage},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'P'})}).catch(()=>{});
          // #endregion
          isListeningRef.current = true;
          isStuckRef.current = false;
          setIsListening(true);
          setIsStuck(false);
          setError(null);
          setLastActivityTime(Date.now());
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onresult-fixed',message:'Fixed language onresult called',data:{resultIndex:event.resultIndex,resultsLength:event.results.length,isListeningRef:isListeningRef.current,language:actualLanguage},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'U'})}).catch(()=>{});
          // #endregion
          
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onresult-fixed',message:'Fixed language results processed',data:{final:final,interim:interim},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'V'})}).catch(()=>{});
          // #endregion

          if (final) {
            finalTranscriptRef.current += final;
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onresult-fixed',message:'Setting final transcript',data:{final:final,finalTranscriptRef:finalTranscriptRef.current,finalTranscriptLength:finalTranscriptRef.current.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'F'})}).catch(()=>{});
            // #endregion
            setTranscript(finalTranscriptRef.current);
          }
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onresult-fixed',message:'Setting interim transcript',data:{interim:interim,interimLength:interim.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          setInterimTranscript(interim);
          setLastActivityTime(Date.now());
          setIsStuck(false);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Erreur de reconnaissance vocale:', event.error);
          let errorMessage = 'Erreur de reconnaissance vocale';
          let shouldRestart = false;
          
          switch (event.error) {
            case 'no-speech':
              return; // Ne pas arrêter l'enregistrement
            case 'audio-capture':
              errorMessage = 'Aucun microphone détecté. Vérifiez vos permissions.';
              isStuckRef.current = true;
              setIsStuck(true);
              break;
            case 'not-allowed':
              errorMessage = 'Permission d\'accès au microphone refusée.';
              isStuckRef.current = true;
              setIsStuck(true);
              break;
            case 'network':
              errorMessage = 'Erreur réseau. Tentative de reconnexion...';
              shouldRestart = true;
              break;
            case 'aborted':
              return;
            default:
              errorMessage = `Erreur: ${event.error}`;
              isStuckRef.current = true;
              setIsStuck(true);
          }
          
          setError(errorMessage);
          if (!shouldRestart) {
            isListeningRef.current = false;
            setIsListening(false);
          } else {
            autoRestartTimeoutRef.current = window.setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.error('Échec du redémarrage automatique:', e);
                  setError('Reconnexion échouée. Vérifiez votre connexion et cliquez sur « Réessayer ».');
                  isStuckRef.current = true;
                  setIsStuck(true);
                  isListeningRef.current = false;
                  setIsListening(false);
                }
              }
            }, 1000);
          }
        };

        recognition.onend = () => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onend',message:'Recognition ended (fixed language)',data:{hasRecognitionRef:!!recognitionRef.current,isListeningRef:isListeningRef.current,isStuckRef:isStuckRef.current,hasAutoRestartTimeout:!!autoRestartTimeoutRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          
          const shouldRestart = recognitionRef.current && 
                                isListeningRef.current && 
                                !isStuckRef.current && 
                                !autoRestartTimeoutRef.current;
          
          if (shouldRestart) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onend',message:'Scheduling restart',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'H'})}).catch(()=>{});
            // #endregion
            autoRestartTimeoutRef.current = window.setTimeout(() => {
              autoRestartTimeoutRef.current = null;
              if (recognitionRef.current && isListeningRef.current) {
                try {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onend',message:'Restarting recognition',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'I'})}).catch(()=>{});
                  // #endregion
                  recognitionRef.current.start();
                } catch (e: any) {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onend',message:'ERROR restarting',data:{error:e?.message || String(e),errorName:e?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'J'})}).catch(()=>{});
                  // #endregion
                  console.error('Échec du redémarrage automatique:', e);
                  setError('Enregistrement bloqué. Cliquez sur « Réessayer ».');
                  isStuckRef.current = true;
                  setIsStuck(true);
                  isListeningRef.current = false;
                  setIsListening(false);
                }
              }
            }, 300);
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:recognition.onend',message:'Not restarting - setting isListening to false',data:{shouldRestart:shouldRestart},timestamp:Date.now(),sessionId:'debug-session',runId:'run15',hypothesisId:'K'})}).catch(()=>{});
            // #endregion
            isListeningRef.current = false;
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de la reconnaissance vocale:', err);
      setError('Impossible d\'initialiser la reconnaissance vocale.');
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignorer les erreurs lors du nettoyage
        }
      }
      if (recognitionFRRef.current) {
        try {
          recognitionFRRef.current.stop();
        } catch (e) {}
      }
      if (recognitionENRef.current) {
        try {
          recognitionENRef.current.stop();
        } catch (e) {}
      }
      if (stuckCheckIntervalRef.current) {
        clearInterval(stuckCheckIntervalRef.current);
      }
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current);
      }
    };
  }, [language]);

  // Vérifier périodiquement si l'enregistrement est bloqué
  useEffect(() => {
    if (!isListening) {
      if (stuckCheckIntervalRef.current) {
        clearInterval(stuckCheckIntervalRef.current);
        stuckCheckIntervalRef.current = null;
      }
      return;
    }

    stuckCheckIntervalRef.current = window.setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (timeSinceLastActivity > 60000) {
        const toStart = (language === 'auto' ? recognitionFRRef.current : recognitionRef.current);
        if (toStart) {
          try {
            toStart.start();
            setLastActivityTime(Date.now());
          } catch (_e) {
            setIsStuck(true);
            setError('L\'enregistrement semble bloqué. Cliquez sur « Réessayer ».');
          }
        } else {
          setIsStuck(true);
          setError('L\'enregistrement semble bloqué. Cliquez sur « Réessayer ».');
        }
      }
    }, 5000);

    return () => {
      if (stuckCheckIntervalRef.current) {
        clearInterval(stuckCheckIntervalRef.current);
        stuckCheckIntervalRef.current = null;
      }
    };
  }, [isListening, lastActivityTime, language]);

  const startListening = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:startListening',message:'startListening called',data:{isSupported:isSupported,language:language,hasRecognitionRef:!!recognitionRef.current,hasRecognitionFRRef:!!recognitionFRRef.current,hasRecognitionENRef:!!recognitionENRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    if (!isSupported) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:startListening',message:'BLOCKED: Not supported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      setError('La reconnaissance vocale n\'est pas disponible.');
      return;
    }

    try {
      networkRetryCountRef.current = 0;
      isStuckRef.current = false;
      setIsStuck(false);
      languageScoresRef.current = { fr: 0, en: 0 };
      
      if (language === 'auto' && recognitionFRRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:startListening',message:'Starting auto mode (FR only - one instance)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        // Une seule instance : Chrome ne supporte pas deux SpeechRecognition en parallèle.
        recognitionFRRef.current.start();
      } else if (recognitionRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:startListening',message:'Starting fixed language mode',data:{language:language},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        finalTranscriptRef.current = transcript;
        recognitionRef.current.start();
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:startListening',message:'ERROR: No recognition instance available',data:{language:language,hasRecognitionRef:!!recognitionRef.current,hasRecognitionFRRef:!!recognitionFRRef.current,hasRecognitionENRef:!!recognitionENRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        throw new Error('Aucune instance de reconnaissance vocale disponible');
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:startListening',message:'ERROR: Exception caught',data:{error:err?.message || String(err),errorName:err?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      console.error('Erreur lors du démarrage:', err);
      setError(`Impossible de démarrer l'enregistrement: ${err?.message || 'Erreur inconnue'}. Réessayez.`);
      isStuckRef.current = true;
      setIsStuck(true);
    }
  }, [transcript, isSupported, language]);

  const stopListening = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:stopListening',message:'stopListening called',data:{hasRecognitionRef:!!recognitionRef.current,hasRecognitionFRRef:!!recognitionFRRef.current,hasRecognitionENRef:!!recognitionENRef.current,isListeningRef:isListeningRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'Q'})}).catch(()=>{});
    // #endregion
    
    isListeningRef.current = false;
    setIsListening(false);
    
    if (recognitionRef.current) {
      try {
        if (autoRestartTimeoutRef.current) {
          clearTimeout(autoRestartTimeoutRef.current);
          autoRestartTimeoutRef.current = null;
        }
        recognitionRef.current.stop();
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:stopListening',message:'ERROR stopping recognitionRef',data:{error:err?.message || String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'R'})}).catch(()=>{});
        // #endregion
        console.error('Erreur lors de l\'arrêt:', err);
      }
    }
    if (recognitionFRRef.current) {
      try {
        recognitionFRRef.current.stop();
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:stopListening',message:'ERROR stopping recognitionFRRef',data:{error:e?.message || String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'S'})}).catch(()=>{});
        // #endregion
      }
    }
    if (recognitionENRef.current) {
      try {
        recognitionENRef.current.stop();
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:stopListening',message:'ERROR stopping recognitionENRef',data:{error:(e as Error)?.message || String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run12',hypothesisId:'T'})}).catch(()=>{});
        // #endregion
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSpeechRecognition.ts:resetTranscript',message:'Resetting transcripts',data:{frTranscriptBefore:frTranscriptRef.current,enTranscriptBefore:enTranscriptRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run9',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    frTranscriptRef.current = '';
    enTranscriptRef.current = '';
    frInterimRef.current = '';
    enInterimRef.current = '';
    languageScoresRef.current = { fr: 0, en: 0 };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const forceLanguage = useCallback((lang: 'fr-FR' | 'en-US') => {
    if (language === 'auto') {
      const langKey = lang === 'fr-FR' ? 'fr' : 'en';
      activeRecognitionRef.current = langKey;
      setDetectedLanguage(lang);
      // Forcer les scores pour maintenir cette langue
      languageScoresRef.current = { 
        fr: lang === 'fr-FR' ? 1 : 0, 
        en: lang === 'en-US' ? 1 : 0 
      };
      
      // Mettre à jour immédiatement les transcripts
      if (lang === 'fr-FR') {
        setTranscript(frTranscriptRef.current);
        setInterimTranscript(frInterimRef.current);
      } else {
        setTranscript(enTranscriptRef.current);
        setInterimTranscript(enInterimRef.current);
      }
    }
  }, [language]);

  return {
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
  };
}
