import { Component, useMemo, useState as useReactState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import CytoscapeComponent from "react-cytoscapejs";
import { GitBranch, Info, Sparkles, LoaderCircle, BrainCircuit } from "lucide-react";
import { useState } from "react";
import { api, DEMO_MODE } from "../services/api";

const priorityRank = { low: 1, medium: 2, high: 3, critical: 4 };
const priorityClass = (value) => {
  const p = String(value || "medium").toLowerCase();
  return priorityRank[p] ? p : "medium";
};
const frequencyRank = (value) => {
  const f = String(value || "").toLowerCase();
  if (f.includes("repeated") || f.includes("pattern")) return 3;
  if (f.includes("recurr")) return 2;
  return 1;
};
const priorityColor = { critical: "#dc4f69", high: "#f08b4e", medium: "#5986e8", low: "#42a887" };

class GraphErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error("Relationships graph failed to render:", error); }
  render() {
    if (this.state.failed) return <div className="empty-state"><strong>Relationship map couldn’t be displayed</strong><p>The case list is still available below. Refresh the page to try the graph again.</p><button className="btn btn-secondary" onClick={() => this.setState({ failed: false })}>Try again</button></div>;
    return this.props.children;
  }
}

const CITY_COORDS = { Mumbai:[19.076,72.8777], Pune:[18.5204,73.8567], Nagpur:[21.1458,79.0882], Nashik:[19.9975,73.7898], Surat:[21.1702,72.8311], Ahmedabad:[23.0225,72.5714], Vadodara:[22.3072,73.1812], Delhi:[28.6139,77.209], "New Delhi":[28.6139,77.209], Jaipur:[26.9124,75.7873], Lucknow:[26.8467,80.9462], Kanpur:[26.4499,80.3319], Varanasi:[25.3176,82.9739], Bhopal:[23.2599,77.4126], Indore:[22.7196,75.8577], Hyderabad:[17.385,78.4867], Bengaluru:[12.9716,77.5946], Bangalore:[12.9716,77.5946], Chennai:[13.0827,80.2707], Kolkata:[22.5726,88.3639], Bhubaneswar:[20.2961,85.8245], Guwahati:[26.1445,91.7362], Patna:[25.5941,85.1376], Ranchi:[23.3441,85.3096], Dehradun:[30.3165,78.0322], Chandigarh:[30.7333,76.7794], Amritsar:[31.634,74.8723], Jammu:[32.7266,74.857], Srinagar:[34.0837,74.7973], Thiruvananthapuram:[8.5241,76.9366], Kochi:[9.9312,76.2673], Coimbatore:[11.0168,76.9558], Visakhapatnam:[17.6868,83.2185], Vijayawada:[16.5062,80.648], Rourkela:[22.2604,84.8536], Warangal:[17.9689,79.5941], Mysuru:[12.2958,76.6394], Mangalore:[12.9141,74.856] };
const STATE_COORDS = {
"andhra pradesh":[16.5,80.6],"arunachal pradesh":[27.1,93.6],assam:[26.2,92.9],bihar:[25.6,85.1],
"chhattisgarh":[21.3,81.6],goa:[15.5,73.8],gujarat:[22.3,71.8],haryana:[29.1,76.1],
"himachal pradesh":[31.1,77.2],jharkhand:[23.6,85.3],karnataka:[15.3,75.7],kerala:[10.5,76.3],
"madhya pradesh":[23.5,78.5],maharashtra:[19.5,75.5],manipur:[24.8,93.9],meghalaya:[25.5,91.3],
mizoram:[23.2,92.8],nagaland:[26.2,94.1],odisha:[20.5,84.4],punjab:[31,75.4],
rajasthan:[26.8,73.8],sikkim:[27.5,88.5],"tamil nadu":[11,78.3],telangana:[17.8,79],
tripura:[23.8,91.3],"uttar pradesh":[26.8,80.9],uttarakhand:[30.1,79.2],"west bengal":[23.5,87.8],
delhi:[28.6,77.2],"jammu and kashmir":[33.7,76],"ladakh":[34.2,77.6],
"andaman and nicobar islands":[11.7,92.7],puducherry:[11.9,79.8]};
function getInstitutionCoords(i) {
 const city=String(i.city||"").trim(); if(CITY_COORDS[city]) return CITY_COORDS[city];
 const state=String(i.state||"").trim().toLowerCase(); if(STATE_COORDS[state]) return STATE_COORDS[state];
 const text=(String(i.name||"")+" "+city+" "+state).toLowerCase();
 const match=Object.keys(CITY_COORDS).find(n=>n.length>4&&text.includes(n.toLowerCase()));
 return match?CITY_COORDS[match]:[22.8,79.0];
}
function ZoomLabels({onZoom}) { const map=useMapEvents({zoomend:()=>onZoom(map.getZoom())}); return null; }
function IndiaBounds() { const map=useMap(); useEffect(()=>{const bounds=L.latLngBounds([[6,67],[37.5,98.5]]);map.setMaxBounds(bounds);map.options.maxBoundsViscosity=1;map.fitBounds(bounds,{padding:[8,8]});},[map]);return null; }
function IndiaIssueMap({ institutions, complaints, onSelect }) { const [zoom,setZoom]=useReactState(4.5); const grouped=useMemo(()=>{const by=new Map(); institutions.forEach(i=>{const coords=getInstitutionCoords(i);const cases=complaints.filter(c=>String(c.institutionId??c.institution_id??'')===String(i.id));const active=cases.filter(c=>!['Resolved','Closed'].includes(String(c.status))).length;by.set(i.id,{...i,coords,cases,active});});return [...by.values()];},[institutions,complaints]);
 return <div className="india-map-shell"><div className="india-map-legend"><span><i/> Open or unresolved issue</span><span>{grouped.length} institutions mapped</span><small>Zoom in to reveal institution names · select a dot for cases</small></div><MapContainer center={[22.8,79]} zoom={4.5} minZoom={4} maxZoom={9} maxBounds={L.latLngBounds([[6,67],[37.5,98.5]])} maxBoundsViscosity={1.0} scrollWheelZoom style={{height:'560px',width:'100%',borderRadius:'18px'}}><IndiaBounds/><TileLayer noWrap attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><ZoomLabels onZoom={setZoom}/>{grouped.map(i=><CircleMarker key={i.id} center={i.coords} radius={Math.min(5+Math.sqrt(i.active)*2,17)} pathOptions={{color:'#fff',weight:1.5,fillColor:'#f43f5e',fillOpacity:.9}} eventHandlers={{click:()=>onSelect(i)}}><Tooltip direction="top" offset={[0,-6]} permanent={zoom>=7} opacity={zoom>=7?1:0.95}>{zoom>=7?i.name:`${i.name} · ${i.active} open issues`}</Tooltip></CircleMarker>)}</MapContainer></div> }


function FormattedAnalysis({ text }) {
  const lines = String(text || "").replace(/\r/g, "").replace(/\s+###\s+/g, "\n### ").replace(/\s+[-*]\s+(?=[A-Z])/g, "\n- ").split("\n");
  const blocks = [];
  let bullets = [];
  const flush = () => { if (bullets.length) { blocks.push({type:"list", items:bullets}); bullets=[]; } };
  lines.forEach((raw, index) => {
    const line = raw.trim().replace(/^#{1,4}\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1");
    if (!line) { flush(); return; }
    if (/^[-*•]\s+/.test(line)) { bullets.push(line.replace(/^[-*•]\s+/, "")); return; }
    flush();
    const headingLike = /^what (the|may|to|this|these|pattern|the pattern)|^key (findings|signals|recommendations)|^strongest connection|^summary|^recommended|^priority|^patterns? observed/i.test(line);
    blocks.push({type: headingLike ? "heading" : "paragraph", text: line.replace(/^\*+|\*+$/g, "")});
  });
  flush();
  return <div className="graph-analysis-body">{blocks.map((b,i)=>b.type==="list" ? <ul key={i}>{b.items.map((x,j)=><li key={j}>{x}</li>)}</ul> : b.type==="heading" ? <h4 key={i}>{b.text.replace(/:$/, "")}</h4> : <p key={i}>{b.text}</p>)}</div>;
}

export default function Relationships({ complaints = [], user = null }) {
  const [scope, setScope] = useState("all");
  const [analysis, setAnalysis] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analysisView, setAnalysisView] = useState("Highlights");
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const runAnalysis = async () => {
    if (DEMO_MODE) { setAnalysisError("Graph AI analysis needs real-backend mode. Set VITE_DEMO_MODE=false in the project-root .env and restart the app."); return; }
    if (!related.length) { setAnalysisError("There are no related records to analyse yet."); return; }
    setAnalysing(true); setAnalysisError(""); setAnalysis("");
    try { const result = await api.analyzeGraph({ cases: related.slice(0, 35).map(c => ({ id:c.id, title:String(c.title||"").slice(0,90), institution:String(c.institution||"").slice(0,70), category:c.category, bureau:c.bureau, priority:c.priority, frequency:c.frequencySignal || c.frequency || "First Reported", status:c.status, related:c.related })) }); setAnalysis(result.answer || "No analysis was returned."); }
    catch (err) { setAnalysisError(err.message || "Could not analyse graph data."); }
    finally { setAnalysing(false); }
  };
  const safeComplaints = Array.isArray(complaints) ? complaints.filter(c => c && c.id) : [];
  const userInstitutionId = user?.institutionId ?? user?.institution_id ?? user?.profile?.institutionId ?? user?.profile?.institution_id ?? "";
  const scopedComplaints = scope === "mine" && userInstitutionId
    ? safeComplaints.filter(c => String(c.institutionId ?? c.institution_id ?? "") === String(userInstitutionId))
    : safeComplaints;
  const related = scopedComplaints.filter(c => c.related || frequencyRank(c.frequencySignal || c.frequency) > 1);
  const graph = useMemo(() => {
    const nodes = [];
    const edges = [];
    const institutions = new Map();
    const caseRecords = related.map((c) => {
      const id = String(c.id);
      const instId = String(c.institutionId ?? c.institution_id ?? c.institution ?? "unknown");
      const institutionName = String(c.institution || c.institutionName || `Institution ${instId}`);
      const priority = priorityClass(c.priority);
      const frequency = frequencyRank(c.frequencySignal || c.frequency);
      if (!institutions.has(instId)) institutions.set(instId, { id: `inst-${instId}`, label: institutionName, cases: [], rank: 1 });
      const inst = institutions.get(instId);
      inst.cases.push(c);
      inst.rank = Math.max(inst.rank, priorityRank[priority] || 1);
      return { c, id, instId, priority, frequency, institutionName };
    });

    // Use stable, spaced columns instead of a force layout that can bunch nodes together.
    const institutionList = [...institutions.entries()];
    const columnGap = 470;
    const startX = 240;
    const rowGap = 150;
    institutionList.forEach(([instId, inst], column) => {
      const x = startX + column * columnGap;
      const instY = 360;
      const priorities = ["low", "medium", "high", "critical"];
      const p = priorities[inst.rank - 1] || "medium";
      nodes.push({ data: { id: inst.id, label: inst.label, type: "institution", priority: p, frequency: Math.min(inst.cases.length, 3), size: 150 + Math.min(inst.cases.length, 4) * 12, color: priorityColor[p], count: inst.cases.length }, position: { x, y: instY }, locked: true });
      const localCases = caseRecords.filter(item => item.instId === instId);
      localCases.forEach((item, index) => {
        const above = index % 2 === 0;
        const lane = Math.floor(index / 2);
        const y = instY + (above ? -1 : 1) * (145 + lane * rowGap);
        const xCase = x + (above ? -125 : 125);
        nodes.push({ data: { id: `case-${item.id}`, label: item.id, title: String(item.c.title || "Untitled complaint"), type: "case", priority: item.priority, frequency: item.frequency, size: 34 + item.frequency * 13, color: priorityColor[item.priority] }, position: { x: xCase, y }, locked: true });
        edges.push({ data: { id: `edge-${item.id}`, source: `case-${item.id}`, target: inst.id, label: String(item.c.category || "Institution link"), edgeType: "institution" } });
      });
    });

    // Add a sparse set of cross-institution links. Keep the graph readable by
    // limiting each case to one cross-institution connection and preferring
    // exact category matches over loose title-token overlap.
    const normalise = value => String(value || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(word => word.length > 3 && !["with", "from", "that", "this", "issue", "delay", "related", "case"].includes(word));
    const candidates = [];
    for (let i = 0; i < caseRecords.length; i++) {
      for (let j = i + 1; j < caseRecords.length; j++) {
        const a = caseRecords[i], b = caseRecords[j];
        if (a.instId === b.instId) continue;
        const catA = String(a.c.category || "").toLowerCase().trim();
        const catB = String(b.c.category || "").toLowerCase().trim();
        const tokensA = new Set(normalise(a.c.title));
        const overlap = normalise(b.c.title).filter(token => tokensA.has(token)).length;
        const sameCategory = Boolean(catA && catA === catB);
        if (!sameCategory && overlap < 2) continue;
        candidates.push({ a, b, i, j, score: (sameCategory ? 10 : 0) + overlap });
      }
    }
    candidates.sort((x, y) => y.score - x.score);
    const crossDegree = new Map();
    for (const link of candidates) {
      const aid = `case-${link.a.id}`, bid = `case-${link.b.id}`;
      if ((crossDegree.get(aid) || 0) >= 1 || (crossDegree.get(bid) || 0) >= 1) continue;
      crossDegree.set(aid, 1); crossDegree.set(bid, 1);
      edges.push({ data: { id: `similar-${link.i}-${link.j}`, source: aid, target: bid, label: "", edgeType: "cross-institution" } });
    }
    return [...nodes, ...edges];
  }, [related]);

  const stylesheet = [
    { selector: "node", style: { "label": "data(label)", "font-size": 10, "text-wrap": "wrap", "text-max-width": 105, "text-valign": "center", "text-halign": "center", "width": "data(size)", "height": "data(size)", "background-color": "data(color)", "color": "#302b4d", "border-width": 2, "border-color": "data(color)", "border-opacity": 0.8, "text-outline-width": 1, "text-outline-color": "#ffffff", "text-outline-opacity": 0.85 } },
    { selector: 'node[type="institution"]', style: { "shape": "round-rectangle", "width": "data(size)", "height": 54, "background-color": "#f2efff", "border-color": "data(color)", "border-width": 2, "font-weight": 700, "font-size": 10, "padding": "8px" } },
    { selector: 'node[type="case"]', style: { "font-size": 9 } },
    { selector: 'edge[edgeType="institution"]', style: { "width": 1.4, "line-color": "#bdb7d6", "target-arrow-shape": "triangle", "target-arrow-color": "#bdb7d6", "curve-style": "bezier", "label": "data(label)", "font-size": 8, "color": "#77718f", "text-rotation": "autorotate", "text-background-color": "#ffffff", "text-background-opacity": 0.88, "text-background-padding": 2 } },
    { selector: 'edge[edgeType="cross-institution"]', style: { "width": 2, "line-color": "#8a6be8", "line-opacity": 0.62, "target-arrow-shape": "none", "line-style": "dashed", "curve-style": "bezier", "control-point-step-size": 70, "label": "", "z-index": 0 } }
  ];

  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow">INTELLIGENCE / RELATIONSHIPS</div><h1>Related cases</h1><p>Explore recurring complaint signals across institutions.</p></div><span className="prototype-label">RULE-BASED SIGNALS</span></div>
    <div className="demo-banner"><Info size={17}/><div><strong>Review before concluding</strong><span>Links are signals based on available case data, not confirmed duplicates or evidence of wrongdoing.</span></div></div>
    <div className="relationship-layout">
      <section className="panel graph-panel india-map-panel"><div className="panel-heading graph-panel-heading"><div><h2>India issue map</h2><p>Geographic distribution of unresolved complaints · zoom for institution labels</p></div><div className="graph-heading-actions"><button className="btn btn-primary graph-analysis-button" onClick={runAnalysis} disabled={analysing || !related.length}><Sparkles size={15}/>{analysing?"Analysing…":"AI analyse patterns"}</button></div></div>{analysisError&&<div className="form-error">{analysisError}</div>}{analysis&&<div className="graph-analysis-result"><div className="graph-analysis-title"><strong>✦ AI pattern analysis</strong></div><FormattedAnalysis text={analysis}/><small>AI-generated observations are signals for review, not proof of causation or wrongdoing.</small></div>}<IndiaIssueMap institutions={[...new Map(safeComplaints.map(c=>[String(c.institutionId??c.institution_id??c.institution),{id:c.institutionId??c.institution_id??c.institution,name:c.institution||c.institutionName||"Unknown institution",city:c.city||c.institutionCity||"",state:c.state||c.institutionState||""}])).values()]} complaints={safeComplaints} onSelect={i=>{setSelectedInstitution(i);}}/><div className="map-selected-detail">{selectedInstitution?<><strong>{selectedInstitution.name}</strong><span>{selectedInstitution.city}, {selectedInstitution.state} · {selectedInstitution.active} unresolved issues</span><div>{selectedInstitution.cases.slice(0,8).map(c=><button key={c.id} className="map-case-chip" onClick={()=>window.location.assign(`/complaints/${encodeURIComponent(c.id)}`)}>{c.id} · {c.title}</button>)}</div></>:<span>Select a red marker to inspect its institution and cases.</span>}</div></section>
      <section className="panel related-list-panel"><div className="panel-heading"><div><h2>Flagged records</h2><p>Open a record to review its context</p></div></div>
        {related.map(c => <article className="related-record" key={c.id}><div className="related-record-icon" style={{color:priorityColor[priorityClass(c.priority)],background:`${priorityColor[priorityClass(c.priority)]}18`}}><GitBranch size={16}/></div><div><strong>{c.id} · {c.title || "Untitled complaint"}</strong><span>{c.institution || "Institution not specified"}</span><small>{c.category || "Uncategorised"} · {c.bureau || "Unassigned"} · {c.priority || "Medium"} · {c.frequencySignal || c.frequency || "First Reported"}</small></div></article>)}
        {!related.length && <p className="empty-note">No flagged records available.</p>}
      </section>
    </div>
  </div>;
}
