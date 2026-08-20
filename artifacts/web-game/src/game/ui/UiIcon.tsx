/**
 * UI icon image with emoji fallback.
 * Path: src/game/ui/UiIcon.tsx
 */
import React, { useState } from 'react';
import { iconUrl, type UiIconId } from './uiIcons';

interface Props {
  id: UiIconId | string;
  emoji?: string;
  size?: number;
  className?: string;
  title?: string;
}

export default function UiIcon({ id, emoji = '•', size = 20, className = '', title }: Props) {
  const [failed, setFailed] = useState(false);
  const src = iconUrl(id);

  if (failed || !src) {
    return (
      <span className={`leading-none ${className}`} style={{ fontSize: size * 0.85 }} title={title}>
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={title ?? String(id)}
      title={title}
      width={size}
      height={size}
      draggable={false}
      className={`object-contain pointer-events-none select-none ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
