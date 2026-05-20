type DeadlineState = {
  label: string;
  tone: string;
};

type DeadlineBadgeProps = {
  deadline: DeadlineState | undefined;
};

export function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  if (!deadline) return null;

  return (
    <p className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ring-1 ${deadline.tone}`}>
      {deadline.label}
    </p>
  );
}
