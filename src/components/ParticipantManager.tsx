import { useState, useEffect } from 'react';
import { Participant } from '../types';
import { ConversationStorage } from '../utils/storage';
import { getColorForParticipant } from '../utils/colors';
import './ParticipantManager.css';

interface ParticipantManagerProps {
  onParticipantAdded?: (participant: Participant) => void;
}

export function ParticipantManager({ onParticipantAdded }: ParticipantManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = () => {
    const allParticipants = ConversationStorage.getAllParticipants();
    setParticipants(allParticipants);
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newParticipantName.trim()) return;

    const existingParticipant = participants.find(
      p => p.name.toLowerCase() === newParticipantName.trim().toLowerCase()
    );

    if (existingParticipant) {
      alert('Ce participant existe déjà');
      return;
    }

    const newParticipant: Participant = {
      id: `participant_${Date.now()}`,
      name: newParticipantName.trim(),
      color: getColorForParticipant(participants.length),
    };

    ConversationStorage.saveParticipant(newParticipant);
    setParticipants(prev => [...prev, newParticipant]);
    setNewParticipantName('');
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3ca1e0f1-45a0-49e0-9ce7-9ab78536b3b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParticipantManager.tsx:handleAddParticipant',message:'Participant added',data:{participantId:newParticipant.id,participantName:newParticipant.name,totalParticipants:participants.length + 1,hasCallback:!!onParticipantAdded},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (onParticipantAdded) {
      onParticipantAdded(newParticipant);
    }
  };

  const handleDeleteParticipant = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      ConversationStorage.deleteParticipant(id);
      setParticipants(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="participant-manager">
      <button
        className="btn-toggle-manager"
        onClick={() => setIsOpen(!isOpen)}
      >
        👥 Gérer les participants {isOpen ? '▼' : '▶'}
      </button>

      {isOpen && (
        <div className="participant-manager-panel">
          <form onSubmit={handleAddParticipant} className="participant-form">
            <input
              type="text"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              placeholder="Nom du participant"
              className="participant-input"
            />
            <button type="submit" className="btn-add-participant">
              Ajouter
            </button>
          </form>

          <div className="participants-list">
            <h3>Participants existants</h3>
            {participants.length === 0 ? (
              <p className="no-participants">Aucun participant enregistré</p>
            ) : (
              <ul>
                {participants.map(participant => (
                  <li key={participant.id} className="participant-item">
                    <span
                      className="participant-color"
                      style={{ backgroundColor: participant.color }}
                    />
                    <span className="participant-name">{participant.name}</span>
                    <button
                      onClick={() => handleDeleteParticipant(participant.id)}
                      className="btn-delete-participant"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
