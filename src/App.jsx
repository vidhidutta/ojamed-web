import { useRef, useState } from "react";
import "./styles.css";
import { convertFile, API_URL } from "./api";

export default function App() {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");
  const [hint, setHint] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileRef.current.files = e.dataTransfer.files;
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      setMsg("");
      setHint("");
      setStatus("File selected: " + file.name);
    }
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setHint("");
    setStatus("");
    setProgress(0);
    
    const f = fileRef.current?.files?.[0];
    if (!f) { 
      setMsg("⚠️ Please select a .ppt, .pptx, or .pdf file first.");
      return; 
    }

    setBusy(true);
    setStatus("🔄 Processing your medical slides...");
    
    // Simulate progress for better UX
    const progressInterval = simulateProgress();
    
    try {
      setStatus("📊 Extracting text and images from slides...");
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(30);
      
      setStatus("🧠 Generating medical flashcards with AI...");
      await new Promise(resolve => setTimeout(resolve, 1200));
      setProgress(60);
      
      setStatus("📝 Creating Anki deck...");
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(80);
      
      setStatus("📦 Packaging your deck...");
      const zip = await convertFile(f);
      setProgress(100);
      
      const url = URL.createObjectURL(zip);
      const a = document.createElement("a");
      a.href = url; 
      a.download = "ojamed_deck.zip";
      document.body.appendChild(a); 
      a.click(); 
      a.remove();
      URL.revokeObjectURL(url);
      
      setStatus("✅ Deck generated successfully!");
      setMsg("🎉 Your Anki deck is ready! The ZIP contains both deck.csv and deck.apkg files.");
      setHint("💡 If the .apkg import has issues, use the deck.csv file inside the ZIP.");
      
    } catch (err) {
      clearInterval(progressInterval);
      const text = String(err?.message || err);
      setStatus("❌ Generation failed");
      setMsg("⚠️ " + text);
      
      if (text.includes("CORS")) {
        setHint("🔧 CORS issue detected. Add your domain to ALLOWED_ORIGINS on the API and redeploy.");
      } else if (text.includes("413")) {
        setHint("📏 File too large. Try a smaller file or increase MAX_FILE_MB on the API.");
      } else if (text.includes("500")) {
        setHint("🔍 Server error. Check the API logs or try again in a few minutes.");
      } else {
        setHint("🔍 Check your internet connection and try again.");
      }
    } finally {
      clearInterval(progressInterval);
      setBusy(false);
      setTimeout(() => {
        setProgress(0);
        setStatus("");
      }, 3000);
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">
          <span className="logo-icon">🏥</span>
          <h1>OjaMed</h1>
        </div>
        <p className="tagline">Transform Medical Lectures into Anki Flashcards</p>
      </div>

      <div className="main-card">
        <div className="upload-section">
          <h2>Upload Your Medical Slides</h2>
          <p className="description">
            Upload PowerPoint (.ppt/.pptx) or PDF files to generate comprehensive 
            medical flashcards optimized for Anki study sessions.
          </p>

          <form onSubmit={onSubmit} className="upload-form">
            <div 
              className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${busy ? 'disabled' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="drop-content">
                <span className="drop-icon">📁</span>
                <p className="drop-text">
                  {dragActive ? "Drop your file here!" : "Drag & drop your slides here"}
                </p>
                <p className="drop-subtext">or click to browse</p>
                <input 
                  type="file" 
                  ref={fileRef} 
                  accept=".ppt,.pptx,.pdf"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="file-input"
                  disabled={busy}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="generate-btn"
              disabled={busy || !fileRef.current?.files?.[0]}
            >
              {busy ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                "🚀 Generate Medical Flashcards"
              )}
            </button>
          </form>

          {status && (
            <div className="status-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="status-text">{status}</p>
            </div>
          )}

          {msg && (
            <div className="message-section">
              <p className="message">{msg}</p>
              {hint && <p className="hint">{hint}</p>}
            </div>
          )}
        </div>

        <div className="features-section">
          <h3>✨ What You Get</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <h4>Medical Flashcards</h4>
              <p>AI-generated Q&A pairs from your lecture content</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <h4>Anki Ready</h4>
              <p>Direct import to Anki with proper formatting</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <h4>Fast Processing</h4>
              <p>Generate decks in minutes, not hours</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <h4>Secure</h4>
              <p>Your files are processed securely and not stored</p>
            </div>
          </div>
        </div>

        <div className="api-info">
          <small>
            <strong>API Endpoint:</strong> {API_URL || "(not configured)"} • 
            <strong>Max File Size:</strong> ~50 MB • 
            <strong>Supported:</strong> .ppt, .pptx, .pdf
          </small>
        </div>
      </div>

      <footer className="footer">
        <p>🏥 OjaMed - Medical Education Made Simple</p>
        <p className="disclaimer">
          Not affiliated with Anki. Not medical advice. For educational purposes only.
        </p>
      </footer>
    </div>
  );
}

