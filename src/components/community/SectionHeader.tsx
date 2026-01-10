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
          className="text-xs text-primary hover:underline whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
