import { Volume2, VolumeX } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';

interface SpeechButtonProps {
  text: string;
  size?: number;
  className?: string;
}

export default function SpeechButton({ text, size = 18, className = '' }: SpeechButtonProps) {
  const { speak, isSpeaking } = useSpeech();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(text);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Pronounce"
      className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
        isSpeaking
          ? 'bg-indigo-100 text-indigo-600 animate-pulse scale-110'
          : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
      } ${className}`}
      aria-label="Speak pronunciation"
    >
      {isSpeaking ? <Volume2 size={size} className="text-indigo-600" /> : <Volume2 size={size} />}
    </button>
  );
}
