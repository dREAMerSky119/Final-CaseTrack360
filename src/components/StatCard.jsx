export default function StatCard({ icon: Icon, label, value, note, tone = "purple" }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} strokeWidth={1.8} /></div>
      <div className="stat-copy">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </article>
  );
}
