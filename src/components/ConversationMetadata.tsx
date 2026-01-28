import { useState, useEffect } from 'react';
import { Conversation } from '../types';
import { ConversationStorage } from '../utils/storage';
import './ConversationMetadata.css';

interface ConversationMetadataProps {
  conversation: Conversation;
  onUpdate: (conversation: Conversation) => void;
}

export function ConversationMetadata({ conversation, onUpdate }: ConversationMetadataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(conversation.metadata.name);
  const [type, setType] = useState(conversation.metadata.type || '');
  const [folder, setFolder] = useState(conversation.metadata.folder || '');
  const [tags, setTags] = useState(conversation.metadata.tags?.join(', ') || '');

  useEffect(() => {
    setName(conversation.metadata.name);
    setType(conversation.metadata.type || '');
    setFolder(conversation.metadata.folder || '');
    setTags(conversation.metadata.tags?.join(', ') || '');
  }, [conversation]);

  const handleSave = () => {
    const updated: Conversation = {
      ...conversation,
      metadata: {
        ...conversation.metadata,
        name: name.trim() || conversation.metadata.name,
        type: type.trim() || undefined,
        folder: folder.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      },
    };

    ConversationStorage.saveConversation(updated);
    onUpdate(updated);
    setIsOpen(false);
  };

  return (
    <div className="conversation-metadata">
      <button
        className="btn-toggle-metadata"
        onClick={() => setIsOpen(!isOpen)}
      >
        ⚙️ Métadonnées {isOpen ? '▼' : '▶'}
      </button>

      {isOpen && (
        <div className="metadata-panel">
          <div className="metadata-field">
            <label>Nom de la conversation</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="metadata-input"
            />
          </div>

          <div className="metadata-field">
            <label>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="metadata-input"
            >
              <option value="">Aucun</option>
              <option value="réunion">Réunion</option>
              <option value="appel">Appel</option>
              <option value="interview">Interview</option>
              <option value="formation">Formation</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="metadata-field">
            <label>Dossier</label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="Ex: 2024/01 ou projet-x"
              className="metadata-input"
            />
            <small className="metadata-hint">
              Utilisez des slashes (/) pour créer des sous-dossiers
            </small>
          </div>

          <div className="metadata-field">
            <label>Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: important, client, suivi"
              className="metadata-input"
            />
          </div>

          <div className="metadata-actions">
            <button onClick={handleSave} className="btn-save-metadata">
              Enregistrer
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-cancel-metadata"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
