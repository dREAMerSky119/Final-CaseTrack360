export default function Badge({ value }) {
  const key = String(value || "").toLowerCase().replaceAll(" ", "-");
  return <span className={`badge badge-${key}`}>{value}</span>;
}
