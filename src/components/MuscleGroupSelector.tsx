import { cn } from '@/lib/utils';
import { MUSCLE_GROUPS, getMuscleGroup } from '@/lib/constants';

interface MuscleGroupSelectorProps {
  selected: string[];
  onToggle: (id: string) => void;
  size?: 'sm' | 'md';
}

export const MuscleGroupSelector = ({ selected, onToggle, size = 'md' }: MuscleGroupSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {MUSCLE_GROUPS.map((group) => {
        const isSelected = selected.includes(group.id);
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onToggle(group.id)}
            className={cn(
              'rounded-full border transition-all font-medium',
              size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1.5 text-sm',
              isSelected
                ? 'border-transparent text-white shadow-md'
                : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
            style={isSelected ? { backgroundColor: group.color, boxShadow: `0 2px 8px ${group.color}40` } : {}}
          >
            {group.emoji} {group.label}
          </button>
        );
      })}
    </div>
  );
};

interface MuscleGroupBadgesProps {
  groups: string[];
  size?: 'xs' | 'sm';
}

export const MuscleGroupBadges = ({ groups, size = 'xs' }: MuscleGroupBadgesProps) => {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((id) => {
        const group = getMuscleGroup(id);
        if (!group) return null;
        return (
          <span
            key={id}
            className={cn(
              'rounded-full text-white font-medium inline-flex items-center',
              size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
            )}
            style={{ backgroundColor: group.color }}
          >
            {size === 'xs' ? group.label.slice(0, 4) : group.label}
          </span>
        );
      })}
    </div>
  );
};
