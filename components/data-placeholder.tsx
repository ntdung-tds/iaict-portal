type DataPlaceholderProps = {
  label: string;
  title: string;
  description: string;
};

export function DataPlaceholder({ label, title, description }: DataPlaceholderProps) {
  return (
    <div className="data-placeholder" role="status">
      <span>{label}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
