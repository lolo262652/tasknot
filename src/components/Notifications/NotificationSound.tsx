import React, { useEffect, useRef } from 'react';
import { Task } from '../../store/taskStore';

interface NotificationSoundProps {
  newTask: Task | null;
}

export default function NotificationSound({ newTask }: NotificationSoundProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = () => {
    try {
      // Créer un nouveau contexte audio si nécessaire
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Configurer le son de notification
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, context.currentTime); // Ré5
      
      // Configurer l'enveloppe du son
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);

      // Connecter les nœuds
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Jouer le son
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    } catch (error) {
      console.warn('Erreur lors de la lecture du son:', error);
    }
  };

  useEffect(() => {
    if (newTask) {
      playNotificationSound();
    }
  }, [newTask]);

  return null;
}
