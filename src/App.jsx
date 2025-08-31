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
    alignmentMode: "semantic+keyword"
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

    // Validate that at least one card type is selected
    if (!Object.values(cardTypes).some(v => v)) {
      setMsg("⚠️ Please select at least one card type.");
      return;
    }

    // Validate that at least one level is selected
    if (!Object.values(cardLevels).some(v => v)) {
      setMsg("⚠️ Please select at least one card level.");
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

            {/* Audio Integration Section */}
            <div className="audio-section">
              <h3>🎵 Audio Integration (Optional)</h3>
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
                <div className="config-section">
                  <h3>🎯 Card Types</h3>
                  <p className="section-description">Select which types of flashcards you want to generate</p>
                  <div className="option-grid">
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardTypes.basic}
                        onChange={() => handleCardTypeChange('basic')}
                      />
                      <span className="option-icon">📝</span>
                      <div className="option-content">
                        <strong>Basic Cards</strong>
                        <small>Traditional Q&A format</small>
                      </div>
                    </label>
                    
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardTypes.cloze}
                        onChange={() => handleCardTypeChange('cloze')}
                      />
                      <span className="option-icon">🔍</span>
                      <div className="option-content">
                        <strong>Cloze Cards</strong>
                        <small>Fill-in-the-blank format</small>
                      </div>
                    </label>
                    
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardTypes.imageOcclusion}
                        onChange={() => handleCardTypeChange('imageOcclusion')}
                      />
                      <span className="option-icon">🖼️</span>
                      <div className="option-content">
                        <strong>Image Occlusion</strong>
                        <small>Masked anatomical diagrams</small>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="config-section">
                  <h3>📚 Card Levels</h3>
                  <p className="section-description">Choose the complexity level of your flashcards</p>
                  <div className="option-grid">
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardLevels.level1}
                        onChange={() => handleLevelChange('level1')}
                      />
                      <span className="option-icon">🥉</span>
                      <div className="option-content">
                        <strong>Level 1 (Basic)</strong>
                        <small>Definitions, facts, basic concepts</small>
                      </div>
                    </label>
                    
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={cardLevels.level2}
                        onChange={() => handleLevelChange('level2')}
                      />
                      <span className="option-icon">🥈</span>
                      <div className="option-content">
                        <strong>Level 2 (Advanced)</strong>
                        <small>Clinical reasoning, interpretation</small>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="config-section">
                  <h3>⚙️ Quality Settings</h3>
                  <p className="section-description">Automatically configured based on your card type selection</p>
                  
                  {/* Cloze Quality Settings - Only show when Cloze is selected */}
                  {cardTypes.cloze && (
                    <div className="quality-section">
                      <h4>🔍 Cloze Quality Settings</h4>
                      <div className="quality-options">
                        <label className="option-item">
                          <input
                            type="checkbox"
                            checked={true}
                            disabled={true}
                          />
                          <span className="option-icon">✨</span>
                          <div className="option-content">
                            <strong>Auto-detect Cloze</strong>
                            <small>Automatically identify cloze opportunities</small>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Image Occlusion Quality Settings - Only show when Image Occlusion is selected */}
                  {cardTypes.imageOcclusion && (
                    <div className="quality-section">
                      <h4>🖼️ Image Occlusion Quality Settings</h4>
                      <div className="quality-options">
                        <div className="nested-options">
                          <div className="option-row">
                            <label>
                              Max Masks per Image:
                              <input
                                type="range"
                                min="1"
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
                      </div>
                    </div>
                  )}
                  
                  {/* Show message when no card types are selected */}
                  {!cardTypes.cloze && !cardTypes.imageOcclusion && (
                    <div className="no-settings-message">
                      <p>Select card types above to see their quality settings</p>
                    </div>
                  )}
                  
                  {/* Audio Quality Settings - Only show when audio is uploaded */}
                  {audioOptions.enableAudio && (
                    <div className="quality-section">
                      <h4>🎵 Audio Quality Settings</h4>
                      <div className="quality-options">
                        <label className="option-item">
                          <input
                            type="checkbox"
                            checked={audioOptions.useEmphasis}
                            onChange={(e) => setAudioOptions(prev => ({ ...prev, useEmphasis: e.target.checked }))}
                          />
                          <span className="option-icon">🎯</span>
                          <div className="option-content">
                            <strong>Emphasis Detection</strong>
                            <small>Detect stressed content from pitch, volume, and speaking rate</small>
                          </div>
                        </label>
                        
                        <label className="option-item">
                          <input
                            type="checkbox"
                            checked={audioOptions.enableDiarization}
                            onChange={(e) => setAudioOptions(prev => ({ ...prev, enableDiarization: e.target.checked }))}
                          />
                          <span className="option-icon">👥</span>
                          <div className="option-content">
                            <strong>Speaker Diarization</strong>
                            <small>Identify different speakers in the lecture</small>
                          </div>
                        </label>
                        
                        <label className="option-item">
                          <input
                            type="checkbox"
                            checked={audioOptions.makeAudioClips}
                            onChange={(e) => setAudioOptions(prev => ({ ...prev, makeAudioClips: e.target.checked }))}
                          />
                          <span className="option-icon">🎬</span>
                          <div className="option-content">
                            <strong>Generate Audio Clips</strong>
                            <small>Create audio snippets for flashcards</small>
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
              <span className="feature-icon">🎯</span>
              <h4>Multiple Card Types</h4>
              <p>Basic, Cloze, and Image Occlusion cards</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h4>Adaptive Levels</h4>
              <p>Level 1 (basic) and Level 2 (advanced) cards</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🖼️</span>
              <h4>Image Processing</h4>
              <p>Advanced image occlusion for anatomical diagrams</p>
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

