import { useState, useEffect } from 'react';
import { Conversation } from '../types';
import { ConversationStorage } from '../utils/storage';
import { format } from 'date-fns';
import './ConversationList.css';

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({ onSelectConversation, onNewConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    const allConversations = ConversationStorage.getAllConversations();
    setConversations(allConversations.sort((a, b) => 
      new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime()
    ));
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      ConversationStorage.searchConversations(searchQuery).some(c => c.metadata.id === conv.metadata.id);
    
    const matchesStatus = filterStatus === 'all' || conv.metadata.status === filterStatus;
    
    const matchesFolder = selectedFolder === 'all' || conv.metadata.folder === selectedFolder;
    
    return matchesSearch && matchesStatus && matchesFolder;
  });

  const handleArchive = (id: string) => {
    const conv = ConversationStorage.getConversation(id);
    if (conv) {
      conv.metadata.status = 'archived';
      ConversationStorage.saveConversation(conv);
      loadConversations();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      ConversationStorage.deleteConversation(id);
      loadConversations();
    }
  };

  const folders = Array.from(new Set(conversations.map(c => c.metadata.folder).filter(Boolean)));

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Conversations</h2>
        <button onClick={onNewConversation} className="btn-new-conversation">
          ➕ Nouvelle conversation
        </button>
      </div>

      <div className="conversation-list-filters">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <div className="filter-group">
          <label>Statut :</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">Toutes</option>
            <option value="active">Actives</option>
            <option value="archived">Archivées</option>
          </select>
        </div>

        {folders.length > 0 && (
          <div className="filter-group">
            <label>Dossier :</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="conversations-container">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation enregistrée'}
          </div>
        ) : (
          <ul className="conversations">
            {filteredConversations.map(conv => (
              <li key={conv.metadata.id} className="conversation-item">
                <div
                  className="conversation-item-content"
                  onClick={() => onSelectConversation(conv.metadata.id)}
                >
                  <div className="conversation-item-header">
                    <h3>{conv.metadata.name}</h3>
                    <span className={`status-badge status-${conv.metadata.status}`}>
                      {conv.metadata.status === 'active' ? 'Active' : 'Archivée'}
                    </span>
                  </div>
                  <div className="conversation-item-meta">
                    <span className="meta-date">
                      {format(new Date(conv.metadata.date), 'dd MMM yyyy')}
                    </span>
                    {conv.metadata.participants.length > 0 && (
                      <span className="meta-participants">
                        👥 {conv.metadata.participants.length} participant(s)
                      </span>
                    )}
                    {conv.metadata.type && (
                      <span className="meta-type">{conv.metadata.type}</span>
                    )}
                  </div>
                  {conv.metadata.folder && (
                    <div className="conversation-item-folder">
                      📁 {conv.metadata.folder}
                    </div>
                  )}
                  <p className="conversation-item-preview">
                    {conv.content.substring(0, 150)}
                    {conv.content.length > 150 ? '...' : ''}
                  </p>
                </div>
                <div className="conversation-item-actions">
                  {conv.metadata.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(conv.metadata.id);
                      }}
                      className="btn-archive"
                      title="Archiver"
                    >
                      📦
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conv.metadata.id);
                    }}
                    className="btn-delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
