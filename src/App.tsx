import { useState, useEffect } from 'react';
import { ConversationEditor } from './components/ConversationEditor';
import { ConversationList } from './components/ConversationList';
import { ParticipantManager } from './components/ParticipantManager';
import { ConversationMetadata } from './components/ConversationMetadata';
import { ConversationStorage } from './utils/storage';
import { Conversation } from './types';
import './App.css';

function App() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    // Charger la conversation en cours si elle existe
    const savedId = ConversationStorage.getCurrentConversationId();
    if (savedId) {
      const conv = ConversationStorage.getConversation(savedId);
      if (conv) {
        setCurrentConversationId(savedId);
        setCurrentConversation(conv);
      }
    }
  }, []);

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    ConversationStorage.setCurrentConversationId(id);
    const conv = ConversationStorage.getConversation(id);
    setCurrentConversation(conv);
    setShowList(false);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    ConversationStorage.setCurrentConversationId(null);
    setCurrentConversation(null);
    setShowList(false);
  };

  const handleBackToList = () => {
    setShowList(true);
  };

  const handleConversationUpdate = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  return (
    <div className="app">
      {showList ? (
        <div className="app-layout-list">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>
      ) : (
        <div className="app-layout-editor">
          <div className="editor-sidebar">
            <button onClick={handleBackToList} className="btn-back">
              ← Retour à la liste
            </button>
            <ParticipantManager />
            {currentConversation && (
              <ConversationMetadata
                conversation={currentConversation}
                onUpdate={handleConversationUpdate}
              />
            )}
          </div>
          <div className="editor-main">
            <ConversationEditor
              conversationId={currentConversationId}
              onSave={() => {
                if (currentConversationId) {
                  const updated = ConversationStorage.getConversation(currentConversationId);
                  if (updated) {
                    setCurrentConversation(updated);
                  }
                }
              }}
              onNewConversation={handleNewConversation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
