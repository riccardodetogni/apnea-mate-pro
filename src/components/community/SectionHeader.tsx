interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader = ({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) => {
  return (
    <div className="section-title">
      <span>{title}</span>
      {actionLabel && (
        <button
          onClick={onAction}
          className="text-xs text-foreground/70 hover:text-foreground hover:underline whitespace-nowrap transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
