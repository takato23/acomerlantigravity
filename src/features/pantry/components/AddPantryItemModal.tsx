'use client';

import { PantryItemFormWithVoice } from './PantryItemFormWithVoice';

interface AddPantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPantryItemModal({ isOpen, onClose }: AddPantryItemModalProps) {
  if (!isOpen) return null;

  return (
    <PantryItemFormWithVoice 
      onClose={onClose}
      onSuccess={onClose}
    />
  );
}
