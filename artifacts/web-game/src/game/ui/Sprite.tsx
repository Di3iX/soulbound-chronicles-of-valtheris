/**
 * Image with emoji fallback if PNG missing / failed to load.
 * Path: src/game/ui/Sprite.tsx
 */
import React, { useState } from 'react';
import { spriteUrl } from './sprites';

interface Props {
  file: string;
  emoji: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  title?: string;
}

export default function Sprite({
  file, emoji, alt, className = '', imgClassName = '', title,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed || !file) {
    return (
      <span className={`leading-none select-none ${className}`} title={title}>
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={spriteUrl(file)}
      alt={alt ?? emoji}
      title={title}
      draggable={false}
      className={`object-contain pointer-events-none select-none ${imgClassName} ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
