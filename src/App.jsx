import React, { useState, useRef } from 'react';
import './styles.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's a PowerPoint file
      if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
          file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
        setSelectedFile(file);
        setStatus(`Selected PowerPoint: ${file.name}`);
      } else {
        setStatus('Please select a PowerPoint presentation (.pptx or .ppt)');
        setSelectedFile(null);
      }
    }
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
              <button 
                className="generate-btn"
                onClick={processPowerPoint}
                disabled={isProcessing}
              >
                {isProcessing ? '🔄 Generating...' : '🚀 Generate Flashcards'}
              </button>
            </div>
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