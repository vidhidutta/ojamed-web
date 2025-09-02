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
    setStatus('📖 Extracting slides from PowerPoint...');
    setProcessingProgress(10);

    try {
      // Step 1: Extract slides from PowerPoint
      const formData = new FormData();
      formData.append('presentation', selectedFile);
      
      const extractResponse = await fetch('http://localhost:8000/extract_slides', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to extract slides from PowerPoint');
      }

      const extractResult = await extractResponse.json();
      const slides = extractResult.slides || [];
      setExtractedSlides(slides);
      setProcessingProgress(30);
      setStatus(`✅ Extracted ${slides.length} slides. Analyzing images...`);

      // Step 2: Process each slide for image occlusion
      const results = {};
      let totalRegions = 0;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        setProcessingProgress(30 + (i / slides.length) * 60);
        setStatus(`🔍 Analyzing slide ${i + 1}/${slides.length}: ${slide.title || 'Untitled'}`);

        if (slide.images && slide.images.length > 0) {
          // Process each image in the slide
          for (let j = 0; j < slide.images.length; j++) {
            const imageData = slide.images[j];
            
            try {
              // Create FormData for the image analysis request
              const analysisFormData = new FormData();
              analysisFormData.append('image_data', imageData.image_data);
              analysisFormData.append('slide_text', slide.text || '');
              analysisFormData.append('transcript_text', 'Lecture transcript for context');
              analysisFormData.append('max_masks_per_image', maxMasksPerImage);
              analysisFormData.append('min_mask_area_px', 900);
              analysisFormData.append('detection_threshold', confidenceThreshold);
              analysisFormData.append('nms_iou_threshold', 0.5);

              const analysisResponse = await fetch('http://localhost:8000/detect_segment_rank', {
                method: 'POST',
                body: analysisFormData,
              });

              if (analysisResponse.ok) {
                const analysisResult = await analysisResponse.json();
                const regions = analysisResult || [];
                
                if (!results[slide.id]) {
                  results[slide.id] = { slide, images: {} };
                }
                
                results[slide.id].images[imageData.id] = {
                  image: imageData,
                  regions: regions
                };
                
                totalRegions += regions.length;
              } else {
                console.error(`Failed to analyze image ${j + 1} in slide ${i + 1}:`, analysisResponse.status);
              }
            } catch (error) {
              console.error(`Error analyzing image ${j + 1} in slide ${i + 1}:`, error);
            }
          }
        }
      }

      setSlideResults(results);
      setProcessingProgress(100);
      setStatus(`🎯 Analysis complete! Found ${totalRegions} potential occlusion regions across ${slides.length} slides`);
      
    } catch (error) {
      console.error('PowerPoint processing error:', error);
      setStatus(`❌ Error processing PowerPoint: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePackage = async () => {
    if (!selectedFile) {
      setStatus('Please select a PowerPoint presentation first');
      return;
    }

    setIsProcessing(true);
    setStatus('Generating comprehensive medical package...');
    setProcessingProgress(10);

    try {
      // Create FormData for the complete package generation
      const formData = new FormData();
      formData.append('presentation', selectedFile);
      formData.append('card_types', JSON.stringify(selectedCardTypes));
      formData.append('card_levels', JSON.stringify(selectedCardLevels));
      formData.append('deck_name', 'Medical Lecture Deck');

      setProcessingProgress(30);
      setStatus('📦 Processing PowerPoint and generating flashcards...');

      // Call the new complete package endpoint
      const response = await fetch('http://localhost:8000/generate_complete_package', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate complete package');
      }

      const result = await response.json();
      setProcessingProgress(100);
      
      if (result.success) {
        setStatus(`✅ Package generated successfully! ${result.message}`);
        
        // Store the generated package info
        setGeneratedPackage(result);
        setDownloadLinks(result.files);
        
        // Show download options to user
        setStatus(`🎯 Generated ${result.stats.total_flashcards} flashcards with ${result.stats.image_occlusion_regions} image occlusion regions. Download your files below:`);
        
        // Automatically trigger zip download
        if (result.files.zip) {
          window.open(`http://localhost:8000${result.files.zip}`, '_blank');
        }
      } else {
        setStatus(`❌ Package generation failed: ${result.message}`);
      }
      
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

      <div className="container">
        {/* Main Content Area */}
        <div className="main-content">
          {/* Upload Section */}
          <div className="upload-section">
            <h2>Upload Your Medical Lecture</h2>
            <p>Transform your PowerPoint or PDF lectures into comprehensive medical understanding. Our AI acts as your personal medical professor, providing both flashcards AND comprehensive notes with visual mind maps and expert knowledge gap filling.</p>
            
            <div className="file-upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pptx,.ppt,.pdf"
                style={{ display: 'none' }}
              />
              <div 
                className="upload-zone"
                onClick={() => fileInputRef.current.click()}
              >
                <div className="upload-icon">📁</div>
                <p className="upload-text">Drag & drop your medical lecture here</p>
                <p className="upload-subtext">or click to browse</p>
              </div>
              {selectedFile && (
                <div className="file-info">
                  <span>✅ {selectedFile.name}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => {
                      setSelectedFile(null);
                      setExtractedSlides([]);
                      setSlideResults({});
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Audio Integration Section - Inside Upload Card */}
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
                    <label htmlFor="audio-upload" className="audio-upload-zone">
                      <div className="audio-icon">🎤</div>
                      <p>Upload Lecture Audio</p>
                      <p className="audio-formats">MP3, WAV, M4A, or FLAC • Max 100MB</p>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Options Section */}
          <div className="advanced-section">
            <button 
              className="toggle-btn standalone"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              {showAdvancedOptions ? '▼ Hide Advanced Options' : '▼ Show Advanced Options'}
            </button>
            
            {showAdvancedOptions && (
              <div className="advanced-options">
                {/* Card Types */}
                <div className="option-group">
                  <h3>🎯 Card Types</h3>
                  <div className="card-options">
                    <div 
                      className={`card-option ${selectedCardTypes.includes('basic') ? 'selected' : ''}`}
                      onClick={() => toggleCardType('basic')}
                    >
                      <div className="card-icon">📝</div>
                      <div className="card-content">
                        <h4>Basic Cards</h4>
                        <p>Traditional Q&A format</p>
                      </div>
                      {selectedCardTypes.includes('basic') && <div className="checkmark">✓</div>}
                    </div>
                    
                    <div 
                      className={`card-option ${selectedCardTypes.includes('cloze') ? 'selected' : ''}`}
                      onClick={() => toggleCardType('cloze')}
                    >
                      <div className="card-icon">🔍</div>
                      <div className="card-content">
                        <h4>Cloze Cards</h4>
                        <p>Fill-in-the-blank format</p>
                      </div>
                      {selectedCardTypes.includes('cloze') && <div className="checkmark">✓</div>}
                    </div>
                    
                    <div 
                      className={`card-option ${selectedCardTypes.includes('image-occlusion') ? 'selected' : ''}`}
                      onClick={() => toggleCardType('image-occlusion')}
                    >
                      <div className="card-icon">🖼️</div>
                      <div className="card-content">
                        <h4>Image Occlusion</h4>
                        <p>Masked anatomical diagrams</p>
                      </div>
                      {selectedCardTypes.includes('image-occlusion') && <div className="checkmark">✓</div>}
                    </div>
                  </div>
                </div>

                {/* Card Levels */}
                <div className="option-group">
                  <h3>📊 Card Levels</h3>
                  <div className="card-levels">
                    <div 
                      className={`card-level-option ${selectedCardLevels.includes('level1') ? 'selected' : ''}`}
                      onClick={() => toggleCardLevel('level1')}
                    >
                      <div className="card-level-icon">🎯</div>
                      <div className="card-level-content">
                        <h4>Level 1</h4>
                        <p>Basic recall & definitions</p>
                      </div>
                      {selectedCardLevels.includes('level1') && <div className="checkmark">✓</div>}
                    </div>
                    
                    <div 
                      className={`card-level-option ${selectedCardLevels.includes('level2') ? 'selected' : ''}`}
                      onClick={() => toggleCardLevel('level2')}
                    >
                      <div className="card-level-icon">🧠</div>
                      <div className="card-level-content">
                        <h4>Level 2</h4>
                        <p>Clinical reasoning & application</p>
                      </div>
                      {selectedCardLevels.includes('level2') && <div className="checkmark">✓</div>}
                    </div>
                  </div>
                </div>

                {/* Quality Settings */}
                <div className="option-group">
                  <h3>⚙️ Quality Settings</h3>
                  <div className="quality-settings">
                    <p>Select a card type above to see quality settings</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Action Button */}
          <div className="main-action">
            <button 
              className="generate-btn"
              onClick={handleGeneratePackage}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing PowerPoint...
                </>
              ) : (
                <>
                  🧠 Generate Comprehensive Medical Package
                </>
              )}
            </button>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="progress-text">{Math.round(processingProgress)}% Complete</p>
            </div>
          )}

          {/* Status Display */}
          {status && (
            <div className="status-display">
              <p>{status}</p>
            </div>
          )}

          {/* Download Section */}
          {generatedPackage && downloadLinks && (
            <div className="download-section">
              <h3>📥 Download Your Medical Package</h3>
              <div className="download-stats">
                <div className="stat-item">
                  <span className="stat-number">{generatedPackage.stats.total_flashcards}</span>
                  <span className="stat-label">Total Flashcards</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{generatedPackage.stats.image_occlusion_regions}</span>
                  <span className="stat-label">Image Occlusion Regions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{generatedPackage.stats.slides_processed}</span>
                  <span className="stat-label">Slides Processed</span>
                </div>
              </div>
              
              <div className="download-buttons">
                <a 
                  href={`http://localhost:8000${downloadLinks.zip}`}
                  className="download-btn primary"
                  download
                >
                  📦 Download Complete Package (ZIP)
                </a>
                <a 
                  href={`http://localhost:8000${downloadLinks.apkg}`}
                  className="download-btn"
                  download
                >
                  🃏 Download Anki Deck (.apkg)
                </a>
                <a 
                  href={`http://localhost:8000${downloadLinks.csv}`}
                  className="download-btn"
                  download
                >
                  📊 Download CSV Export (.csv)
                </a>
              </div>
            </div>
          )}

          {/* PowerPoint Results */}
          {Object.keys(slideResults).length > 0 && (
            <div className="results-section">
              <h3>🎯 PowerPoint Analysis Results</h3>
              <div className="slides-overview">
                {Object.values(slideResults).map((slideData, slideIndex) => (
                  <div key={slideIndex} className="slide-card">
                    <div className="slide-header">
                      <h4>Slide {slideIndex + 1}: {slideData.slide.title || 'Untitled'}</h4>
                      <span className="slide-text-length">
                        {slideData.slide.text ? `${slideData.slide.text.length} characters` : 'No text'}
                      </span>
                    </div>
                    
                    {Object.keys(slideData.images).length > 0 ? (
                      <div className="slide-images">
                        {Object.values(slideData.images).map((imageData, imageIndex) => (
                          <div key={imageIndex} className="image-result">
                            <div className="image-info">
                              <span className="image-label">Image {imageIndex + 1}</span>
                              <span className="region-count">
                                {imageData.regions.length} regions detected
                              </span>
                            </div>
                            
                            {imageData.regions.length > 0 && (
                              <div className="regions-preview">
                                {imageData.regions.slice(0, 3).map((region, regionIndex) => (
                                  <span key={regionIndex} className="region-preview">
                                    {region.term || `Region ${regionIndex + 1}`}
                                  </span>
                                ))}
                                {imageData.regions.length > 3 && (
                                  <span className="more-regions">
                                    +{imageData.regions.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-images">No images found in this slide</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h3>✨ What You Get - Beyond Traditional Flashcards</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h4>AI Medical Expert</h4>
              <p>AI acts as your personal medical professor, comprehensively understanding your entire lecture</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h4>Comprehensive Medical Notes</h4>
              <p>Professional PDF with learning objectives, clinical pearls, and expert explanations</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h4>Visual Mind Maps</h4>
              <p>Concept relationships and connections shown through beautiful visual diagrams</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h4>Knowledge Gap Filling</h4>
              <p>AI identifies and fills missing foundational knowledge for complete understanding</p>
            </div>
            
            <div className="feature-card featured">
              <div className="feature-icon">🎯</div>
              <h4>Enhanced Flashcards</h4>
              <p>Level 1 (basic) and Level 2 (clinical reasoning) cards with relationships</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💎</div>
              <h4>Clinical Pearls</h4>
              <p>Key insights and practical knowledge extracted from your lecture content</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h4>Advanced Processing</h4>
              <p>Image occlusion, cloze deletion, and audio integration capabilities</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h4>Anki Ready</h4>
              <p>Direct import to Anki with proper formatting and organization</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-info">
            <span>API Endpoint: https://ankigenerator.onrender.com</span>
            <span>Max File Size: ~50 MB</span>
            <span>Supported: .ppt, .pptx, .pdf</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;

