import './ui.css';

interface StatCardProps {
  label: string;
  value: number | string;
  tone?: 'primary' | 'slate' | 'amber';
}

export function StatCard({ label, value, tone = 'slate' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
    </div>
  );
}
