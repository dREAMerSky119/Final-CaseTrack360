import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Clock3, FileText, Flag, Plus, RefreshCw } from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from "chart.js";
import { format, subDays } from "date-fns";
import Badge from "../components/Badge";
import StatCard from "../components/StatCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);
const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#211b3b", padding: 10, cornerRadius: 8 } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: "#89869a", font: { size: 10 } } }, y: { grid: { color: "#efedf5" }, border: { display: false }, ticks: { color: "#89869a", precision: 0, font: { size: 10 } } } } };

export default function Dashboard({ complaints, user }) {
  const navigate = useNavigate();
  // Count each complaint ID once so dashboard cards and charts share one source of truth.
  const records = useMemo(() => [...new Map(complaints.filter(c => c && c.id).map(c => [String(c.id), c])).values()], [complaints]);
  const today = new Date();
  const isAdmin = user?.role === "Administrator";
  const metrics = useMemo(() => {
    const open = records.filter(c => c.status === "Open").length;
    const progress = records.filter(c => c.status === "In Progress").length;
    const resolved = records.filter(c => ["Resolved", "Closed"].includes(c.status)).length;
    const overdue = records.filter(c => c.due && new Date(c.due) < today && !["Resolved", "Closed"].includes(c.status)).length;
    const high = records.filter(c => ["High", "Critical"].includes(c.priority)).length;
    const related = records.filter(c => c.related).length;
    return { open, progress, resolved, overdue, high, related };
  }, [records]);
  const statusNames = isAdmin ? ["Open", "In Progress", "Pending", "Resolved", "Closed"] : ["Open", "In Progress", "Pending", "Resolved"];
  const statusCounts = statusNames.map(status => records.filter(c => c.status === status).length);
  const otherStatusCount = records.filter(c => !statusNames.includes(c.status)).length;
  const chartStatusNames = otherStatusCount ? [...statusNames, "Other"] : statusNames;
  const chartStatusCounts = otherStatusCount ? [...statusCounts, otherStatusCount] : statusCounts;
  const priorityCounts = ["Low", "Medium", "High", "Critical"].map(priority => records.filter(c => c.priority === priority).length);
  const bureauNames = [...new Set(records.map(c => c.bureau))];
  const bureauCounts = bureauNames.map(b => records.filter(c => c.bureau === b).length);
  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const trend = days.map(d => records.filter(c => format(new Date(c.received), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")).length);
  const recent = [...records].sort((a,b) => b.received.localeCompare(a.received)).slice(0, 5);
  const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: "72%", plugins: { legend: { display: false } } };
  const colors = ["#9c91e8", "#6f5be8", "#edaa55", "#e16e76", "#77b99a"];
  return <div className="page-content">
    <div className="page-heading">
      <div><div className="eyebrow"><span className="live-dot"></span> OVERVIEW <span className="eyebrow-date">/ {format(today, "EEEE, d MMMM yyyy")}</span></div><h1>Complaint intelligence, at a glance <span className="wave">✳</span></h1><p>Here’s what’s happening across your complaint workspace.</p></div>
      <div className="heading-actions"><button className="btn btn-secondary" onClick={() => window.location.reload()}><RefreshCw size={15} /> Refresh</button>{!isAdmin && <button className="btn btn-primary" onClick={() => navigate("/complaints/new")}><Plus size={16} /> Register complaint</button>}</div>
    </div>
    <div className="demo-banner"><div className="banner-dot"></div><div><strong>Prototype workspace</strong><span>Showing synthetic demonstration records. This is not connected to live AICTE systems.</span></div><button onClick={() => navigate("/settings")}>About this demo <ArrowRight size={14}/></button></div>
    <div className="section-line"><span>CASE SNAPSHOT</span><span className="section-period">All time <ChevronDownTiny /></span></div>
    <div className="stats-grid">
      <StatCard icon={FileText} label="Total complaints" value={records.length} note="Across all institutions" tone="purple"/>
      <StatCard icon={Clock3} label="Open cases" value={metrics.open + metrics.progress} note={`${metrics.open} open · ${metrics.progress} in progress`} tone="blue"/>
      {isAdmin && <StatCard icon={CheckCircle2} label="Resolved / closed cases" value={metrics.resolved} note="Administrator view" tone="green"/>}
      {isAdmin && <StatCard icon={AlertTriangle} label="Overdue cases" value={metrics.overdue} note="Administrator view · past due" tone="red"/>}
    </div>
    <div className="dashboard-grid">
      <section className="panel trend-panel">
        <div className="panel-heading"><div><h2>Complaint activity</h2><p>New complaints received over the last 7 days</p></div>{isAdmin && <button className="text-action" onClick={() => navigate("/analytics")}>View analytics <ArrowRight size={14}/></button>}</div>
        <div className="chart-large"><Line data={{ labels: days.map(d => format(d, "dd MMM")), datasets: [{ data: trend, borderColor: "#6748ff", backgroundColor: "rgba(119,91,255,.22)", fill: true, tension: .36, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: "#6748ff", pointBorderColor: "#ffffff", pointBorderWidth: 2, pointHoverRadius: 6 }] }} options={chartOptions}/></div>
        <div className="chart-foot"><span><i className="legend-dot purple-dot"></i>Complaints received</span><span className="muted">Daily count · demo data</span></div>
      </section>
      <section className="panel status-panel">
        <div className="panel-heading"><div><h2>Case status</h2><p>Current distribution</p></div><button className="more-button" onClick={() => navigate("/complaints")}>•••</button></div>
        <div className="donut-wrap"><div className="donut"><Doughnut data={{ labels: chartStatusNames, datasets: [{ data: chartStatusCounts, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] }} options={doughnutOptions}/><div className="donut-center"><strong>{records.length}</strong><span>total cases</span></div></div></div>
        <div className="status-legend">{chartStatusNames.map((s,i)=><div key={s}><span><i style={{background:colors[i % colors.length]}}></i>{s}</span><strong>{chartStatusCounts[i]}</strong></div>)}</div>
      </section>
      {isAdmin && <section className="panel bureau-panel">
        <div className="panel-heading"><div><h2>Workload by bureau</h2><p>Active and resolved cases by handling team</p></div><button className="text-action" onClick={() => navigate("/analytics")}>Details <ArrowRight size={14}/></button></div>
        <div className="chart-medium"><Bar data={{ labels: bureauNames.map(b => b.replace(" Cell","").replace(" Bureau","")), datasets: [{ data: bureauCounts, backgroundColor: "#8065ff", borderRadius: 5, maxBarThickness: 28 }] }} options={chartOptions}/></div>
      </section>}
      {isAdmin && <section className="panel attention-panel">
        <div className="panel-heading"><div><h2>Needs attention</h2><p>Priority cases and approaching deadlines</p></div><span className="attention-count">{metrics.overdue + metrics.high}</span></div>
        <div className="attention-list">
          {records.filter(c => ["High","Critical"].includes(c.priority) || (c.due && new Date(c.due) < today && !["Resolved","Closed"].includes(c.status))).sort((a,b)=>String(a.due||"9999-12-31").localeCompare(String(b.due||"9999-12-31"))).slice(0,4).map(c=><button className="attention-item" key={c.id} onClick={()=>navigate(`/complaints/${c.id}`)}><span className={`attention-symbol ${c.priority.toLowerCase()}`}><Flag size={15}/></span><span className="attention-copy"><strong>{c.title}</strong><small>{c.id} · {c.bureau}</small></span><Badge value={c.priority}/></button>)}
          {!records.some(c => ["High","Critical"].includes(c.priority)) && <p className="empty-note">No priority cases right now.</p>}
        </div>
        {isAdmin && <button className="panel-bottom-link" onClick={()=>navigate("/complaints?overdue=true")}>Review all attention items <ArrowRight size={14}/></button>}
      </section>}
    </div>
    <section className="panel recent-panel">
      <div className="panel-heading"><div><h2>Recently received</h2><p>Latest complaints added to the workspace</p></div><button className="text-action" onClick={()=>navigate("/complaints")}>All complaints <ArrowRight size={14}/></button></div>
      <div className="table-wrap"><table><thead><tr><th>CASE ID</th><th>COMPLAINT</th><th>INSTITUTION</th><th>PRIORITY</th><th>STATUS</th><th>RECEIVED</th><th></th></tr></thead><tbody>
        {recent.map(c=><tr key={c.id} onClick={()=>navigate(`/complaints/${c.id}`)} className="clickable-row"><td><span className="case-id">{c.id}</span>{c.related && <span className="related-mini">Related</span>}</td><td><strong className="table-title">{c.title}</strong><small className="table-subtitle">{c.category}</small></td><td><span className="institution-cell">{c.institution}</span></td><td><Badge value={c.priority}/></td><td><Badge value={c.status}/></td><td className="date-cell">{format(new Date(c.received), "dd MMM yyyy")}</td><td><ArrowRight size={15} className="row-arrow"/></td></tr>)}
      </tbody></table></div>
    </section>
    <div className="dashboard-bottom"><span><i className="live-dot"></i> Data updated just now</span><span>Metrics calculated from {records.length} unique complaint records</span></div>
  </div>;
}
function ChevronDownTiny(){return <span className="tiny-chevron">⌄</span>}
