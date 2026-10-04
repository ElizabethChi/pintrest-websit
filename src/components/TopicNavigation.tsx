import { TOPICS } from '../data/topics';

interface TopicNavigationProps {
  active: string;
  onSelect: (label: string) => void;
}

/**
 * Topic bar. Plain semibold text items on white — no pills. The row scrolls
 * horizontally instead of wrapping; the scrollbar is hidden.
 */
export function TopicNavigation({ active, onSelect }: TopicNavigationProps) {
  return (
    <nav className="topics" aria-label="Topics">
      {TOPICS.map((topic) => {
        const isActive = topic.label === active;
        return (
          <button
            key={topic.label}
            type="button"
            className="topic"
            aria-current={isActive ? 'true' : undefined}
            onClick={(event) => {
              onSelect(topic.label);
              event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
            }}
          >
            {topic.label}
          </button>
        );
      })}
    </nav>
  );
}
