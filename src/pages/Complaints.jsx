import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Papa from "papaparse";
import Badge from "../components/Badge";

export default function Complaints({ complaints, user }) {
  const isAdmin = user?.role === "Administrator";
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("All priorities");
  const [status, setStatus] = useState("All statuses");
  const [frequency, setFrequency] = useState("All frequency");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [relatedOnly, setRelatedOnly] = useState(false);
  const visibleComplaints = useMemo(() => isAdmin ? complaints : complaints.filter(c => c.status !== "Closed" && !(c.due && new Date(c.due) < new Date() && !["Resolved","Closed"].includes(c.status))), [complaints, isAdmin]);
  const filtered = useMemo(() => visibleComplaints.filter(c => {
    const term = search.toLowerCase();
    const matchesSearch = [c.id,c.title,c.institution,c.category,c.bureau,c.official].some(v => String(v || "").toLowerCase().includes(term));
    const overdue = c.due && new Date(c.due) < new Date() && !["Resolved","Closed"].includes(c.status);
    return matchesSearch && (priority === "All priorities" || c.priority === priority) && (status === "All statuses" || c.status === status) && (frequency === "All frequency" || c.frequency === frequency) && (!overdueOnly || overdue) && (!recurringOnly || ["Recurring","Repeated Pattern"].includes(c.frequency)) && (!relatedOnly || c.related);
  }), [visibleComplaints, search, priority, status, frequency, overdueOnly, recurringOnly, relatedOnly]);
  const reset = () => { setSearch(""); setPriority("All priorities"); setStatus("All statuses"); setFrequency("All frequency"); setOverdueOnly(false); setRecurringOnly(false); setRelatedOnly(false); };
  const exportCsv = () => {
    const csv = Papa.unparse(filtered.map(({id,institution,title,category,bureau,official,priority,frequency,status,received,due,related})=>({id,institution,title,category,bureau,official,priority,frequency,status,received,due,related})));
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8;"}));
    const a = document.createElement("a"); a.href = url; a.download = "casetrack-complaints.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow">CASE MANAGEMENT <span className="eyebrow-date">/ ALL RECORDS</span></div><h1>Complaints</h1><p>Search, triage and manage institution-related complaints.</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={exportCsv}><Download size={15}/> Export CSV</button><button className="btn btn-primary" onClick={()=>navigate("/complaints/new")}><Plus size={16}/> Register complaint</button></div></div>
    <div className="list-summary"><div><strong>{filtered.length}</strong> <span>of {visibleComplaints.length} complaints</span></div><div className="summary-pills"><span><i className="pill-dot red-dot"></i>{visibleComplaints.filter(c=>c.priority==="Critical"||c.priority==="High").length} high priority</span><span><i className="pill-dot amber-dot"></i>{visibleComplaints.filter(c=>c.frequency==="Recurring"||c.frequency==="Repeated Pattern").length} recurring</span></div></div>
    <section className="panel complaint-list-panel">
      <div className="filter-toolbar"><div className="search-input"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by case ID, title, institution..."/>{search && <button onClick={()=>setSearch("")} aria-label="Clear search"><X size={14}/></button>}</div><div className="filter-selects"><select value={priority} onChange={e=>setPriority(e.target.value)} aria-label="Filter by priority"><option>All priorities</option>{["Low","Medium","High","Critical"].map(x=><option key={x}>{x}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Filter by status"><option>All statuses</option>{["Open","In Progress","Pending","Resolved",...(isAdmin?["Closed"]:[])].map(x=><option key={x}>{x}</option>)}</select><select value={frequency} onChange={e=>setFrequency(e.target.value)} aria-label="Filter by frequency"><option>All frequency</option>{["First Reported","Recurring","Repeated Pattern","Under Review"].map(x=><option key={x}>{x}</option>)}</select></div><button className="filter-icon-btn" title="Reset filters" onClick={reset}><SlidersHorizontal size={16}/></button></div>
      <div className="quick-filters">{isAdmin && <button className={overdueOnly?"quick-filter selected": "quick-filter"} onClick={()=>setOverdueOnly(!overdueOnly)}><span className="filter-check">{overdueOnly?"✓":""}</span> Overdue only</button>}<button className={recurringOnly?"quick-filter selected": "quick-filter"} onClick={()=>setRecurringOnly(!recurringOnly)}><span className="filter-check">{recurringOnly?"✓":""}</span> Recurring only</button><button className={relatedOnly?"quick-filter selected": "quick-filter"} onClick={()=>setRelatedOnly(!relatedOnly)}><span className="filter-check">{relatedOnly?"✓":""}</span> Related cases</button><button className="clear-filters" onClick={reset}>Clear all</button></div>
      <div className="table-wrap"><table><thead><tr><th>CASE ID</th><th>COMPLAINT / INSTITUTION</th><th>BUREAU / OFFICIAL</th><th>PRIORITY</th><th>FREQUENCY</th><th>STATUS</th>{isAdmin && <th>DUE DATE</th>}</tr></thead><tbody>
      {filtered.map(c=><tr key={c.id} className="clickable-row" onClick={()=>navigate(`/complaints/${c.id}`)}><td><span className="case-id">{c.id}</span>{c.related&&<span className="related-mini">Related</span>}</td><td><strong className="table-title">{c.title}</strong><small className="table-subtitle">{c.institution}</small></td><td><strong className="bureau-cell">{c.bureau}</strong><small className="table-subtitle">{c.official || "Unassigned"}</small></td><td><Badge value={c.priority}/></td><td><Badge value={c.frequency}/></td><td><Badge value={c.status}/></td>{isAdmin && <td className="date-cell">{c.due || "—"}</td>}</tr>)}
      {filtered.length===0&&<tr><td colSpan={isAdmin ? 7 : 6}><div className="empty-state"><div className="empty-state-icon"><Search size={22}/></div><strong>No complaints found</strong><p>Try changing your search or clearing some filters.</p><button className="btn btn-secondary" onClick={reset}>Reset filters</button></div></td></tr>}
      </tbody></table></div><div className="table-footer"><span>Showing {filtered.length} records</span><span>Sorted by latest received date</span></div>
    </section>
  </div>;
}
