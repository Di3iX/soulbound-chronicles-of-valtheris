/**
 * Compact resource bar under MP/HP — shows class resource (rage/focus/…).
 */
import type { ClassResourceState } from './classResource';
import { resourceBarColor } from './classResource';

interface Props {
  resource: ClassResourceState;
  className?: string;
}

export default function ResourceBar({ resource, className = '' }: Props) {
  const pct = resource.max > 0 ? Math.min(100, (resource.current / resource.max) * 100) : 0;
  const color = resourceBarColor(resource.type);

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-0.5 flex justify-between text-[10px] text-white/60">
        <span>{resource.name}</span>
        <span>
          {resource.current}/{resource.max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
