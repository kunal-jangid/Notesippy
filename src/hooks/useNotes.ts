import { useEffect, useState } from 'react';
import { Note, deleteNote, getNotes, saveNote } from '../services/notesStore';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Initial load from MMKV
    setNotes(getNotes());
  }, []);

  const handleSave = async (note: Note) => {
    const updated = await saveNote(note);
    setNotes([...updated]);
  };

  const handleDelete = async (id: string) => {
    const updated = await deleteNote(id);
    setNotes([...updated]);
  };

  return { notes, saveNote: handleSave, deleteNote: handleDelete };
}