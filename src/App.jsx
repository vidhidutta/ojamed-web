import { useRef, useState } from "react";
import "./styles.css";
import { convertFile, API_URL } from "./api";

export default function App(){
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [hint, setHint] = useState("");

  async function onSubmit(e){
    e.preventDefault();
    setMsg("");
    setHint("");
    const f = fileRef.current?.files?.[0];
    if(!f){ setMsg("Choose a .ppt/.pptx/.pdf first."); return; }
    setBusy(true);
    try{
      const zip = await convertFile(f);
      const url = URL.createObjectURL(zip);
      const a = document.createElement("a");
      a.href = url; a.download = "ojamed_deck.zip";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setMsg("✅ Deck generated. If .apkg import hiccups, use deck.csv inside the ZIP.");
    }catch(err){
      const text = String(err?.message || err);
      setMsg("⚠️ " + text);
      if(text.includes("CORS")){
        setHint("Looks like a CORS issue. Add your Pages domain to ALLOWED_ORIGINS on the API and redeploy.");
      }else if(text.includes("413")){
        setHint("File too large. Try a smaller file or increase MAX_FILE_MB on the API.");
      }
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>OjaMed</h1>
        <p className="sub">Turn your lecture slides into an Anki-ready deck in minutes.</p>
        <form onSubmit={onSubmit}>
          <div className="row">
            <input type="file" ref={fileRef} accept=".ppt,.pptx,.pdf" />
            <button disabled={busy}>{busy ? "Generating…" : "Generate deck"}</button>
          </div>
          <small>API: {API_URL || "(not set)"} · Max ~50 MB per file (configurable)</small>
        </form>
        {msg && <p style={{marginTop:12}}>{msg}<br/>{hint && <small>{hint}</small>}</p>}
        <footer>
          Not affiliated with Anki. Not medical advice.
        </footer>
      </div>
    </div>
  );
}
