import { useState } from "react";
import { Bot, X, Send, Sparkles, LoaderCircle, RotateCcw } from "lucide-react";
import { api, DEMO_MODE } from "../services/api";

function InlineText({ text = "" }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}
function FormattedAnswer({ content }) {
  const lines = String(content || "").replace(/\r/g, "").split("\n");
  const blocks = []; let list = []; let table = [];
  const flushList = () => { if (list.length) { blocks.push({ type: "list", items: list }); list = []; } };
  const flushTable = () => { if (table.length) { blocks.push({ type: "table", rows: table }); table = []; } };
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (/^\|.*\|$/.test(trimmed)) {
      flushList();
      if (/^\|?\s*:?-{3,}/.test(trimmed.replace(/\|/g, ""))) return;
      table.push(trimmed.split("|").slice(1, -1).map(cell => cell.trim())); return;
    }
    flushTable();
    if (!trimmed) { flushList(); return; }
    const bullet = trimmed.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) { list.push(bullet[1]); return; }
    flushList();
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { blocks.push({ type: `h${heading[1].length}`, text: heading[2], key: i }); return; }
    blocks.push({ type: "p", text: trimmed, key: i });
  });
  flushList(); flushTable();
  return <div className="formatted-answer">{blocks.map((b, i) => {
    if (b.type === "list") return <ul key={i}>{b.items.map((item, j) => <li key={j}><InlineText text={item}/></li>)}</ul>;
    if (b.type === "table") return <div className="chat-table-wrap" key={i}><table><thead><tr>{(b.rows[0] || []).map((cell,j)=><th key={j}><InlineText text={cell}/></th>)}</tr></thead><tbody>{b.rows.slice(1).map((row,j)=><tr key={j}>{row.map((cell,k)=><td key={k}><InlineText text={cell}/></td>)}</tr>)}</tbody></table></div>;
    if (/^h[1-3]$/.test(b.type)) { const Tag=b.type; return <Tag key={b.key}><InlineText text={b.text}/></Tag>; }
    return <p key={b.key}><InlineText text={b.text}/></p>;
  })}</div>;
}

export default function Chatbot(){
 const [open,setOpen]=useState(false);const [input,setInput]=useState("");const [messages,setMessages]=useState([{role:"assistant",content:"Hi! I’m the CaseTrack 360 assistant. I can explain dashboard metrics, complaint workflows, prioritisation, and how to use this prototype. What can I help with?"}]);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const send=async(e)=>{e?.preventDefault();const text=input.trim();if(!text||busy)return;const history=messages.slice(-8).map(m=>({role:m.role,content:m.content}));setMessages(prev=>[...prev,{role:"user",content:text}]);setInput("");setBusy(true);setError("");try{const result=await api.aiChat(text,history);setMessages(prev=>[...prev,{role:"assistant",content:result.answer}]);}catch(err){setError(err.message||"Could not reach the AI assistant.");}finally{setBusy(false)}};
 return <><button className="chatbot-launcher" onClick={()=>setOpen(v=>!v)} aria-label={open?"Close AI assistant":"Open AI assistant"}>{open?<X size={21}/>:<><Bot size={20}/><span>Ask AI</span><Sparkles size={13}/></>}</button>{open&&<section className="chatbot-panel" role="dialog" aria-label="CaseTrack AI assistant"><header className="chatbot-header"><span className="chatbot-avatar"><Bot size={19}/></span><div><strong>CaseTrack AI</strong><small><i/> {DEMO_MODE?"AI needs real-backend mode":"AI assistant · powered by Groq"}</small></div><button onClick={()=>{setMessages([{role:"assistant",content:"Conversation cleared. What would you like help with?"}]);setError("")}} title="Clear conversation" aria-label="Clear conversation"><RotateCcw size={15}/></button><button onClick={()=>setOpen(false)} aria-label="Close assistant"><X size={17}/></button></header><div className="chatbot-messages">{messages.map((m,i)=><div key={i} className={`chat-message ${m.role}`}><span>{m.role==="assistant"?<Bot size={14}/> : "You"}</span><div className="chat-bubble-content">{m.role==="assistant"?<FormattedAnswer content={m.content}/>:<p>{m.content}</p>}</div></div>)}{busy&&<div className="chat-message assistant"><span><Bot size={14}/></span><div className="chat-bubble-content"><p className="chat-thinking"><LoaderCircle size={14}/> Thinking…</p></div></div>}{error&&<div className="chatbot-error">{error}</div>}</div><div className="chatbot-disclaimer">AI can make mistakes. Verify important decisions. Do not share sensitive personal data.</div><form className="chatbot-compose" onSubmit={send}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about complaints or the dashboard…" maxLength={3000} disabled={busy}/><button type="submit" disabled={busy||!input.trim()} aria-label="Send message"><Send size={16}/></button></form></section>}</>;
}
