import React, { useState, useRef } from 'react';
import './styles.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState('');
  const [regions, setRegions] = useState([]);
  const [showAudioOptions, setShowAudioOptions] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [aiUnderstandingEnabled, setAiUnderstandingEnabled] = useState(true);
  
  // PowerPoint processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedSlides, setExtractedSlides] = useState([]);
  const [slideResults, setSlideResults] = useState({});
  
  // Package generation state
  const [generatedPackage, setGeneratedPackage] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState(null);
  
  // Audio options state
  const [audioFile, setAudioFile] = useState(null);
  const [emphasisDetection, setEmphasisDetection] = useState(true);
  const [speakerDiarization, setSpeakerDiarization] = useState(false);
  const [clipLength, setClipLength] = useState(10);
  const [maxClips, setMaxClips] = useState(5);
  
  // Advanced options state
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.4);
  const [semanticTolerance, setSemanticTolerance] = useState(0.3);
  const [maxMasksPerImage, setMaxMasksPerImage] = useState(6);
  const [maskStyle, setMaskStyle] = useState('fill');

  // Card type selection
  const [selectedCardTypes, setSelectedCardTypes] = useState(['basic']);
  const [selectedCardLevels, setSelectedCardLevels] = useState(['level1']);

  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's a PowerPoint file
      if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
          file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
        setSelectedFile(file);
        setStatus(`Selected PowerPoint: ${file.name}`);
        setExtractedSlides([]);
        setSlideResults({});
      } else {
        setStatus('Please select a PowerPoint presentation (.pptx or .ppt)');
        setSelectedFile(null);
      }
    }
  };

  const handleAudioFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const toggleCardType = (cardType) => {
    setSelectedCardTypes(prev => 
      prev.includes(cardType) 
        ? prev.filter(type => type !== cardType)
        : [...prev, cardType]
    );
  };

  const toggleCardLevel = (cardLevel) => {
    setSelectedCardLevels(prev => 
      prev.includes(cardLevel) 
        ? prev.filter(level => level !== cardLevel)
        : [...prev, cardLevel]
    );
  };

  const processPowerPoint = async () => {
    if (!selectedFile) {
      setStatus('Please select a PowerPoint presentation first');
      return;
    }

    setIsProcessing(true);
    setStatus('📦 Processing PowerPoint and generating flashcards...');
    setProcessingProgress(10);

    try {
      // Prepare form data for the convert endpoint
      const formData = new FormData();
      formData.append('file', selectedFile);

      setProcessingProgress(30);
      setStatus('🔄 Uploading and processing your presentation...');

      // Call the convert endpoint
      const response = await fetch(`${window.location.origin}/convert`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      setProcessingProgress(90);
      setStatus('📥 Downloading your flashcards...');
      
      // The backend returns a ZIP file directly
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ojamed_deck.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setProcessingProgress(100);
      setStatus(`✅ Package generated successfully! Your flashcards have been downloaded.`);
      
    } catch (error) {
      console.error('Package generation error:', error);
      setStatus(`❌ Error generating package: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <div className="logo-square">
              <div className="building-icon">🏢</div>
              <div className="cross-icon">✚</div>
            </div>
          </div>
        </div>
        <div className="brand">
          <h1>OjaMed</h1>
          <p>AI Medical Expert Educator - Beyond Flashcards</p>
        </div>
      </header>

      {/* Main Container */}
      <div className="container">
        {/* Upload Section */}
        <div className="upload-section">
          <h2>Transform your PowerPoint into Medical Flashcards</h2>
          <p>Upload your medical lecture slides and get comprehensive Anki flashcards with image occlusion, semantic analysis, and medical insights.</p>
          
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <h3>Drag and Drop</h3>
              <p>or click to select your PowerPoint file</p>
              <p className="file-types">Supports .pptx and .ppt files</p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,.ppt"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {selectedFile && (
            <div className="file-info">
              <p>✅ Selected: {selectedFile.name}</p>
            </div>
          )}

          {/* Audio Integration Section - Inside Upload Section */}
          {selectedFile && (
            <div className="audio-integration-inline">
              <div className="audio-header">
                <span className="audio-icon-inline">🎵</span>
                <span className="audio-title">Audio Integration (Optional)</span>
                <button 
                  className="toggle-btn-inline"
                  onClick={() => setShowAudioOptions(!showAudioOptions)}
                >
                  {showAudioOptions ? '▼ Hide Audio Options' : '▼ Show Audio Options'}
                </button>
              </div>
              {showAudioOptions && (
                <div className="audio-options-inline">
                  <p>Upload lecture audio to enhance flashcards with emphasis detection and audio clips</p>
                  <div className="audio-upload-area">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileSelect}
                      style={{ display: 'none' }}
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload" className="audio-upload-btn">
                      {audioFile ? `📁 ${audioFile.name}` : '🎵 Upload Audio File'}
                    </label>
                  </div>
                  <div className="audio-settings">
                    <label>
                      <input
                        type="checkbox"
                        checked={emphasisDetection}
                        onChange={(e) => setEmphasisDetection(e.target.checked)}
                      />
                      Emphasis Detection
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={speakerDiarization}
                        onChange={(e) => setSpeakerDiarization(e.target.checked)}
                      />
                      Speaker Diarization
                    </label>
                    <div className="audio-controls">
                      <label>
                        Clip Length: {clipLength}s
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={clipLength}
                          onChange={(e) => setClipLength(parseInt(e.target.value))}
                        />
                      </label>
                      <label>
                        Max Clips: {maxClips}
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={maxClips}
                          onChange={(e) => setMaxClips(parseInt(e.target.value))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Options Section */}
          {selectedFile && (
            <div className="advanced-section">
              <div className="advanced-header">
                <span className="advanced-icon">⚙️</span>
                <span className="advanced-title">Advanced Options</span>
                <button 
                  className="toggle-btn"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  {showAdvancedOptions ? '▼ Hide Advanced Options' : '▼ Show Advanced Options'}
                </button>
              </div>
              {showAdvancedOptions && (
                <div className="advanced-options">
                  {/* Card Types */}
                  <div className="option-group">
                    <h4>🎯 Card Types</h4>
                    <div className="card-options">
                      <label className="card-option">
                        <input
                          type="checkbox"
                          checked={selectedCardTypes.includes('basic')}
                          onChange={() => toggleCardType('basic')}
                        />
                        <span>Basic Q&A</span>
                      </label>
                      <label className="card-option">
                        <input
                          type="checkbox"
                          checked={selectedCardTypes.includes('cloze')}
                          onChange={() => toggleCardType('cloze')}
                        />
                        <span>Cloze Deletion</span>
                      </label>
                      <label className="card-option">
                        <input
                          type="checkbox"
                          checked={selectedCardTypes.includes('image_occlusion')}
                          onChange={() => toggleCardType('image_occlusion')}
                        />
                        <span>Image Occlusion</span>
                      </label>
                    </div>
                  </div>

                  {/* Card Levels */}
                  <div className="option-group">
                    <h4>📊 Card Levels</h4>
                    <div className="level-options">
                      <label className="level-option">
                        <input
                          type="checkbox"
                          checked={selectedCardLevels.includes('level1')}
                          onChange={() => toggleCardLevel('level1')}
                        />
                        <span>Level 1 (Basic)</span>
                      </label>
                      <label className="level-option">
                        <input
                          type="checkbox"
                          checked={selectedCardLevels.includes('level2')}
                          onChange={() => toggleCardLevel('level2')}
                        />
                        <span>Level 2 (Intermediate)</span>
                      </label>
                      <label className="level-option">
                        <input
                          type="checkbox"
                          checked={selectedCardLevels.includes('level3')}
                          onChange={() => toggleCardLevel('level3')}
                        />
                        <span>Level 3 (Advanced)</span>
                      </label>
                    </div>
                  </div>

                  {/* Quality Settings */}
                  <div className="option-group">
                    <h4>⚙️ Quality Settings</h4>
                    <div className="quality-controls">
                      <label>
                        Confidence Threshold: {confidenceThreshold}
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.1"
                          value={confidenceThreshold}
                          onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                        />
                      </label>
                      <label>
                        Semantic Tolerance: {semanticTolerance}
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.1"
                          value={semanticTolerance}
                          onChange={(e) => setSemanticTolerance(parseFloat(e.target.value))}
                        />
                      </label>
                      <label>
                        Max Masks per Image: {maxMasksPerImage}
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={maxMasksPerImage}
                          onChange={(e) => setMaxMasksPerImage(parseInt(e.target.value))}
                        />
                      </label>
                      <label>
                        Mask Style:
                        <select value={maskStyle} onChange={(e) => setMaskStyle(e.target.value)}>
                          <option value="fill">Fill</option>
                          <option value="outline">Outline</option>
                          <option value="blur">Blur</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFile && (
            <button 
              className="generate-btn"
              onClick={processPowerPoint}
              disabled={isProcessing}
            >
              {isProcessing ? '🔄 Generating...' : '🚀 Generate Flashcards'}
            </button>
          )}

          {isProcessing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="progress-text">{processingProgress}% Complete</p>
            </div>
          )}

          {status && (
            <div className="status-section">
              <p className="status-text">{status}</p>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h2>Why Choose OjaMed?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI-Powered Analysis</h3>
              <p>Advanced medical AI understands context and creates clinically relevant flashcards</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🖼️</div>
              <h3>Image Occlusion</h3>
              <p>Automatically detects and masks key anatomical structures and medical images</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Medical Focus</h3>
              <p>Specialized for medical education with terminology and clinical relevance</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Advanced Processing</h3>
              <p>Semantic analysis, key phrase extraction, and intelligent content grouping</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Anki Ready</h3>
              <p>Direct .apkg export for immediate import into Anki with optimized formatting</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Multiple Formats</h3>
              <p>Get flashcards in Anki, CSV, and comprehensive PDF formats</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;