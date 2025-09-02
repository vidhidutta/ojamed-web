// API configuration and functions for ojamed-web

export const API_URL = window.location.origin;

// Legacy file conversion endpoint
export const convertFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/convert`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.blob();
};

// Image Occlusion API endpoints
export const detectSegments = async (imageFile, options = {}) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('slide_text', options.slideText || '');
  formData.append('transcript_text', options.transcriptText || '');
  formData.append('max_masks_per_image', options.maxMasksPerImage || 6);
  formData.append('min_mask_area_px', options.minMaskAreaPx || 900);
  formData.append('detection_threshold', options.detectionThreshold || 0.25);
  formData.append('nms_iou_threshold', options.nmsIouThreshold || 0.5);
  
  const response = await fetch(`${API_URL}/detect_segment_rank`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Detection failed: ${errorText}`);
  }
  
  return response.json();
};

export const buildOcclusionItems = async (imageFile, regions, options = {}) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('regions', JSON.stringify(regions));
  formData.append('max_masks_per_image', options.maxMasksPerImage || 6);
  formData.append('overlap_iou_threshold', options.overlapIouThreshold || 0.4);
  formData.append('mask_style', options.maskStyle || 'fill');
  
  const response = await fetch(`${API_URL}/build_occlusion_items`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Occlusion building failed: ${errorText}`);
  }
  
  return response.blob();
};

export const exportApkg = async (imageFile, regions, deckName = 'Image Occlusion Deck') => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('regions', JSON.stringify(regions));
  formData.append('deck_name', deckName);
  
  const response = await fetch(`${API_URL}/export_apkg`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`APKG export failed: ${errorText}`);
  }
  
  return response.blob();
};

export const getCacheInfo = async () => {
  const response = await fetch(`${API_URL}/cache/info`);
  if (!response.ok) {
    throw new Error('Failed to get cache info');
  }
  return response.json();
};

export const clearCache = async () => {
  const response = await fetch(`${API_URL}/cache/clear`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to clear cache');
  }
  return response.json();
};


