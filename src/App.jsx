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
  
  // Advanced configuration state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cardTypes, setCardTypes] = useState({
    basic: true,
    cloze: false,
    imageOcclusion: false
  });
  const [cardLevels, setCardLevels] = useState({
    level1: true,
    level2: false
  });
  const [advancedOptions, setAdvancedOptions] = useState({
    useCloze: false,
    enableImageOcclusion: false,
    maxMasksPerImage: 6,
    confThreshold: 30,
    useGoogleVision: false,
    enableSemanticMasking: false
  });
  
  // Audio integration state
  const [audioFile, setAudioFile] = useState(null);
  const [audioOptions, setAudioOptions] = useState({
    enableAudio: false,
    useEmphasis: true,
    enableDiarization: false,
    makeAudioClips: false,
    clipLength: 9,
    maxClips: 2,
    alignmentMode: "semantic+keyword",
    showAudio: false // Added for audio section toggle
  });

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

  const handleCardTypeChange = (type) => {
    setCardTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleLevelChange = (level) => {
    setCardLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const handleAdvancedOptionChange = (option, value) => {
    setAdvancedOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = fileRef.current?.files?.[0];
    if (!f) return;

    setBusy(true);
    setMsg("");
    setHint("");
    
    const progressInterval = simulateProgress();
    
    try {
      setStatus("📖 Analyzing your lecture content...");
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(30);
      
      setStatus("🧠 AI medical expert analyzing concepts...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(50);
      
      setStatus("🔍 Identifying knowledge gaps...");
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(60);
      
      setStatus("🗺️ Creating concept mind maps...");
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(70);
      
      setStatus("📝 Creating comprehensive medical notes...");
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(80);
      
      setStatus("📦 Packaging your comprehensive deck...");
      const zip = await convertFile(f);
      setProgress(100);
      
      const url = URL.createObjectURL(zip);
      const a = document.createElement("a");
      a.href = url; 
      a.download = "ojamed_comprehensive_deck.zip";
      document.body.appendChild(a); 
      a.click(); 
      a.remove();
      URL.revokeObjectURL(url);
      
      setStatus("✅ Comprehensive medical package generated successfully!");
      setMsg("🎉 Your comprehensive medical package is ready! The ZIP contains: Anki deck, CSV data, AND comprehensive medical notes with mind maps!");
      setHint("💡 The comprehensive notes PDF includes concept maps, clinical pearls, and expert explanations to help you understand the BIG PICTURE!");
      
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
        <p className="tagline">AI Medical Expert Educator - Beyond Flashcards</p>
      </div>

      <div className="main-card">
        <div className="upload-section">
          <h2>Upload Your Medical Lecture</h2>
          <p className="description">
            Transform your PowerPoint or PDF lectures into comprehensive medical understanding. 
            Our AI acts as your personal medical professor, providing both flashcards AND 
            comprehensive notes with visual mind maps and expert knowledge gap filling.
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
                  {dragActive ? "Drop your lecture here!" : "Drag & drop your medical lecture here"}
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

            {/* Audio Integration Section */}
            <div className={`audio-section ${!audioOptions.showAudio ? 'collapsed' : ''}`}>
              <div className="audio-header">
                <h3>🎵 Audio Integration (Optional)</h3>
                <button
                  type="button"
                  className="audio-toggle-btn"
                  onClick={() => setAudioOptions(prev => ({ ...prev, showAudio: !prev.showAudio }))}
                >
                  {audioOptions.showAudio ? "🔽 Hide Audio Options" : "🔽 Show Audio Options"}
                </button>
              </div>
              
              {audioOptions.showAudio && (
                <>
                  <p className="section-description">
                    Upload lecture audio to enhance flashcards with emphasis detection and audio clips
                  </p>
                  
                  <div className="audio-upload">
                    <label className="audio-upload-label">
                      <input
                        type="file"
                        accept=".mp3,.wav,.m4a,.flac"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setAudioFile(file);
                          setAudioOptions(prev => ({ ...prev, enableAudio: !!file }));
                        }}
                        className="audio-file-input"
                      />
                      <div className="audio-upload-content">
                        <span className="audio-icon">🎤</span>
                        <div className="audio-text">
                          <strong>Upload Lecture Audio</strong>
                          <small>MP3, WAV, M4A, or FLAC • Max 100MB</small>
                        </div>
                      </div>
                    </label>
                    
                    {audioFile && (
                      <div className="audio-file-info">
                        <span className="audio-file-name">📁 {audioFile.name}</span>
                        <button
                          type="button"
                          className="remove-audio-btn"
                          onClick={() => {
                            setAudioFile(null);
                            setAudioOptions(prev => ({ ...prev, enableAudio: false }));
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Advanced Configuration Toggle */}
            <div className="advanced-toggle">
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "🔽 Hide Advanced Options" : "🔽 Show Advanced Options"}
              </button>
            </div>

            {/* Advanced Configuration Panel */}
            {showAdvanced && (
              <div className="advanced-panel">
                {/* Card Types Section */}
                <div className="config-section">
                  <h4>🎯 Card Types</h4>
                  <div className="option-grid">
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardTypes.basic}
                        onChange={() => handleCardTypeChange('basic')}
                      />
                      <div className="option-content">
                        <span className="option-icon">📝</span>
                        <div>
                          <strong>Basic Cards</strong>
                          <small>Traditional Q&A format</small>
                        </div>
                      </div>
                    </label>
                    
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardTypes.cloze}
                        onChange={() => handleCardTypeChange('cloze')}
                      />
                      <div className="option-content">
                        <span className="option-icon">🔍</span>
                        <div>
                          <strong>Cloze Cards</strong>
                          <small>Fill-in-the-blank format</small>
                        </div>
                      </div>
                    </label>
                    
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardTypes.imageOcclusion}
                        onChange={() => handleCardTypeChange('imageOcclusion')}
                      />
                      <div className="option-content">
                        <span className="option-icon">🖼️</span>
                        <div>
                          <strong>Image Occlusion</strong>
                          <small>Masked anatomical diagrams</small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Card Levels Section */}
                <div className="config-section">
                  <h4>📊 Card Levels</h4>
                  <div className="option-grid">
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardLevels.level1}
                        onChange={() => handleLevelChange('level1')}
                      />
                      <div className="option-content">
                        <span className="option-icon">🎯</span>
                        <div>
                          <strong>Level 1</strong>
                          <small>Basic recall & definitions</small>
                        </div>
                      </div>
                    </label>
                    
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardLevels.level2}
                        onChange={() => handleLevelChange('level2')}
                      />
                      <div className="option-content">
                        <span className="option-icon">🧠</span>
                        <div>
                          <strong>Level 2</strong>
                          <small>Clinical reasoning & application</small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Quality Settings Section */}
                <div className="quality-section">
                  <h4>⚙️ Quality Settings</h4>
                  
                  {/* Cloze Quality Settings */}
                  {cardTypes.cloze && (
                    <div className="quality-options">
                      <label className="option-item">
                        <input
                          type="checkbox"
                          checked={advancedOptions.useCloze}
                          onChange={(e) => handleAdvancedOptionChange('useCloze', e.target.checked)}
                        />
                        <div className="option-content">
                          <span className="option-icon">🔍</span>
                          <div>
                            <strong>Auto-detect Cloze</strong>
                            <small>Automatically identify cloze opportunities</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Image Occlusion Quality Settings */}
                  {cardTypes.imageOcclusion && (
                    <div className="quality-options">
                      <div className="option-row">
                        <label>
                          Max Masks per Image:
                          <input
                            type="range"
                            min="2"
                            max="10"
                            value={advancedOptions.maxMasksPerImage}
                            onChange={(e) => handleAdvancedOptionChange('maxMasksPerImage', parseInt(e.target.value))}
                          />
                          <span>{advancedOptions.maxMasksPerImage}</span>
                        </label>
                      </div>
                      
                      <div className="option-row">
                        <label>
                          Confidence Threshold:
                          <input
                            type="range"
                            min="10"
                            max="90"
                            value={advancedOptions.confThreshold}
                            onChange={(e) => handleAdvancedOptionChange('confThreshold', parseInt(e.target.value))}
                          />
                          <span>{advancedOptions.confThreshold}%</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Show message when no relevant card types selected */}
                  {!cardTypes.cloze && !cardTypes.imageOcclusion && (
                    <div className="no-settings-message">
                      Select a card type above to see quality settings
                    </div>
                  )}
                </div>

                {/* Audio Quality Settings */}
                {audioOptions.enableAudio && (
                  <div className="config-section">
                    <h4>🎵 Audio Quality Settings</h4>
                    <div className="option-grid">
                      <label className="option-item">
                        <input
                          type="checkbox"
                          checked={audioOptions.useEmphasis}
                          onChange={(e) => setAudioOptions(prev => ({ ...prev, useEmphasis: e.target.checked }))}
                        />
                        <div className="option-content">
                          <span className="option-icon">🔊</span>
                          <div>
                            <strong>Emphasis Detection</strong>
                            <small>Detect stressed words and concepts</small>
                          </div>
                        </div>
                      </label>
                      
                      <label className="option-item">
                        <input
                          type="checkbox"
                          checked={audioOptions.enableDiarization}
                          onChange={(e) => setAudioOptions(prev => ({ ...prev, enableDiarization: e.target.checked }))}
                        />
                        <div className="option-content">
                          <span className="option-icon">👤</span>
                          <div>
                            <strong>Speaker Diarization</strong>
                            <small>Identify different speakers</small>
                          </div>
                        </div>
                      </label>
                      
                      <label className="option-item">
                        <input
                          type="checkbox"
                          checked={audioOptions.makeAudioClips}
                          onChange={(e) => setAudioOptions(prev => ({ ...prev, makeAudioClips: e.target.checked }))}
                        />
                        <div className="option-content">
                          <span className="option-icon">✂️</span>
                          <div>
                            <strong>Generate Audio Clips</strong>
                            <small>Create audio snippets for flashcards</small>
                          </div>
                        </div>
                      </label>
                      
                      {audioOptions.makeAudioClips && (
                        <div className="nested-options">
                          <div className="option-row">
                            <label>
                              Clip Length (seconds):
                              <input
                                type="range"
                                min="5"
                                max="15"
                                value={audioOptions.clipLength}
                                onChange={(e) => setAudioOptions(prev => ({ ...prev, clipLength: parseInt(e.target.value) }))}
                              />
                              <span>{audioOptions.clipLength}s</span>
                            </label>
                          </div>
                          
                          <div className="option-row">
                            <label>
                              Max Clips per Slide:
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={audioOptions.maxClips}
                                onChange={(e) => setAudioOptions(prev => ({ ...prev, maxClips: parseInt(e.target.value) }))}
                              />
                              <span>{audioOptions.maxClips}</span>
                            </label>
                          </div>
                          
                          <div className="option-row">
                            <label>
                              Alignment Mode:
                              <select
                                value={audioOptions.alignmentMode}
                                onChange={(e) => setAudioOptions(prev => ({ ...prev, alignmentMode: e.target.value }))}
                                className="alignment-select"
                              >
                                <option value="semantic+keyword">Semantic + Keyword (Best)</option>
                                <option value="semantic">Semantic Only</option>
                                <option value="keyword">Keyword Only</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                "🧠 Generate Comprehensive Medical Package"
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
          <h3>✨ What You Get - Beyond Traditional Flashcards</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🧠</span>
              <h4>AI Medical Expert</h4>
              <p>AI acts as your personal medical professor, comprehensively understanding your entire lecture</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <h4>Comprehensive Medical Notes</h4>
              <p>Professional PDF with learning objectives, clinical pearls, and expert explanations</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🗺️</span>
              <h4>Visual Mind Maps</h4>
              <p>Concept relationships and connections shown through beautiful visual diagrams</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <h4>Knowledge Gap Filling</h4>
              <p>AI identifies and fills missing foundational knowledge for complete understanding</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <h4>Enhanced Flashcards</h4>
              <p>Level 1 (basic) and Level 2 (clinical reasoning) cards with relationships</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💎</span>
              <h4>Clinical Pearls</h4>
              <p>Key insights and practical knowledge extracted from your lecture content</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🖼️</span>
              <h4>Advanced Processing</h4>
              <p>Image occlusion, cloze deletion, and audio integration capabilities</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <h4>Anki Ready</h4>
              <p>Direct import to Anki with proper formatting and organization</p>
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
        <p>🏥 OjaMed - AI Medical Expert Educator</p>
        <p className="disclaimer">
          Not affiliated with Anki. Not medical advice. For educational purposes only.
        </p>
      </footer>
    </div>
  );
}

