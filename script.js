// Fourier Transform Visualization
let analyser;
let analyserCanvas;
let analyserCtx;
let frequencyData;
let isAnalyserSetup = false;

console.log("Fourier Visualization setup")

// Set up the Fourier Transform visualization
function setupAnalyser(synth) {
  // Create an analyser node
  analyser = Tone.context.createAnalyser();
  
  // Connect the synth to the analyser
  synth.connect(analyser);
  
  // Set the FFT size - must be a power of 2
  analyser.fftSize = 16384; // Larger FFT size gives better frequency resolution
  
  // Get the canvas and its context
  analyserCanvas = document.getElementById('analyserCanvas');
  analyserCtx = analyserCanvas.getContext('2d');
  
  // Create array to hold frequency data
  frequencyData = new Uint8Array(analyser.frequencyBinCount);
  
  // Set flag
  isAnalyserSetup = true;
  
  // Start animation
  requestAnimationFrame(drawAnalyser);
}

// Draw the circular Fourier Transform visualization
function drawAnalyser() {
  if (!isAnalyserSetup) return;
  
  // Resize the canvas if needed
  if (analyserCanvas.width !== analyserCanvas.offsetWidth || 
      analyserCanvas.height !== analyserCanvas.offsetHeight) {
    analyserCanvas.width = analyserCanvas.offsetWidth;
    analyserCanvas.height = analyserCanvas.offsetHeight;
  }
  
  // Get the frequency data
  analyser.getByteFrequencyData(frequencyData);
  
  // Clear the canvas
  analyserCtx.clearRect(0, 0, analyserCanvas.width, analyserCanvas.height);
  
  // Set up constants for the circular visualization
  const centerX = analyserCanvas.width / 2;
  const centerY = analyserCanvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;
  
  // Maximum frequency to display (330kHz as requested)
  const maxFreq = 330000;
  
  // Draw the circular grid
  drawCircularGrid(centerX, centerY, radius);
  
  // Calculate the number of frequency bins to display
  // (we'll use a logarithmic scale)
  const sampleRate = Tone.context.sampleRate; // Usually 44100 or 48000 Hz
  const binCount = analyser.frequencyBinCount;
  const binWidth = sampleRate / analyser.fftSize;
  
  // Draw the frequency data
  const maxAmplitude = 256; // Max value in frequencyData is 255
  
  // Draw frequency data along the circumference
  analyserCtx.beginPath();
  analyserCtx.moveTo(centerX, centerY - radius);
  
  // Create gradient for the frequency data
  const gradient = analyserCtx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius
  );
  gradient.addColorStop(0, 'rgba(0, 128, 255, 0)');
  gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');
  
  // Draw each frequency bin
  for (let i = 0; i < binCount; i++) {
    // Calculate the frequency for this bin
    const frequency = i * binWidth;
    
    // Skip if above our max frequency
    if (frequency > maxFreq) break;
    
    // Use log scale to map frequency to angle
    // Map from [0, maxFreq] to [0, 2π]
    const logFreq = Math.log(frequency + 1) / Math.log(maxFreq + 1);
    const angle = logFreq * Math.PI * 2 - Math.PI / 2; // Start at top (negative y)
    
    // Calculate amplitude for this frequency
    const amplitude = frequencyData[i] / maxAmplitude;
    
    // Calculate point on circle
    const x = centerX + Math.cos(angle) * radius * (1 - amplitude * 0.5);
    const y = centerY + Math.sin(angle) * radius * (1 - amplitude * 0.5);
    
    // Draw line from edge to this point
    const edgeX = centerX + Math.cos(angle) * radius;
    const edgeY = centerY + Math.sin(angle) * radius;
    
    analyserCtx.strokeStyle = `rgba(0, 255, 255, ${amplitude})`;
    analyserCtx.lineWidth = 2;
    
    analyserCtx.beginPath();
    analyserCtx.moveTo(edgeX, edgeY);
    analyserCtx.lineTo(x, y);
    analyserCtx.stroke();
    
    // Draw a small circle at the point
    if (amplitude > 0.2) {
      analyserCtx.fillStyle = `rgba(255, 255, 255, ${amplitude})`;
      analyserCtx.beginPath();
      analyserCtx.arc(x, y, 3, 0, Math.PI * 2);
      analyserCtx.fill();
    }
  }
  
  // Draw the center frequency labels
  analyserCtx.fillStyle = 'white';
  analyserCtx.font = '12px Arial';
  analyserCtx.textAlign = 'center';
  analyserCtx.textBaseline = 'middle';
  
  // Draw labels for key frequencies
  drawFrequencyLabel('0 Hz', Math.PI * 1.5, centerX, centerY, radius + 15);
  drawFrequencyLabel('100 Hz', Math.PI * 1.75, centerX, centerY, radius + 15);
  drawFrequencyLabel('1 kHz', Math.PI * 0, centerX, centerY, radius + 15);
  drawFrequencyLabel('10 kHz', Math.PI * 0.25, centerX, centerY, radius + 15);
  drawFrequencyLabel('100 kHz', Math.PI * 0.5, centerX, centerY, radius + 15);
  
  // Mark crystal frequencies on the circle
  markCrystalFrequencies(centerX, centerY, radius, maxFreq);
  
  // Continue animation
  requestAnimationFrame(drawAnalyser);
}

// Draw circular grid lines and markers
function drawCircularGrid(centerX, centerY, radius) {
  // Draw the outer circle
  analyserCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  analyserCtx.lineWidth = 1;
  analyserCtx.beginPath();
  analyserCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  analyserCtx.stroke();
  
  // Draw inner circles (amplitude levels)
  for (let i = 1; i <= 4; i++) {
    const innerRadius = radius * i / 5;
    analyserCtx.beginPath();
    analyserCtx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    analyserCtx.stroke();
  }
  
  // Draw radial lines for frequency markers
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    
    analyserCtx.beginPath();
    analyserCtx.moveTo(centerX, centerY);
    analyserCtx.lineTo(x1, y1);
    analyserCtx.stroke();
  }
}

// Helper function to draw text at a specific angle around the circle
function drawFrequencyLabel(text, angle, centerX, centerY, distance) {
  const x = centerX + Math.cos(angle) * distance;
  const y = centerY + Math.sin(angle) * distance;
  
  analyserCtx.save();
  analyserCtx.translate(x, y);
  analyserCtx.rotate(angle);
  analyserCtx.fillText(text, 0, 0);
  analyserCtx.restore();
}

// Mark crystal frequencies on the visualization
function markCrystalFrequencies(centerX, centerY, radius, maxFreq) {
  const crystalFreqs = {
    "Clear Quartz": 32768,
    "Amethyst": 319.68,
    "Rose Quartz": 350,
    "Black Tourmaline": 125,
    "Selenite": 688.35,
    "Citrine": 400,
    "Moldavite": 150000,
    "Lapis Lazuli": 417,
    "Green Aventurine": 250,
    "Malachite": 325
  };
  
  analyserCtx.font = '10px Arial';
  
  for (const [crystal, freq] of Object.entries(crystalFreqs)) {
    // Skip if frequency is too high or too low
    if (freq > maxFreq) continue;
    
    // Use log scale to map frequency to angle
    const logFreq = Math.log(freq + 1) / Math.log(maxFreq + 1);
    const angle = logFreq * Math.PI * 2 - Math.PI / 2; // Start at top
    
    // Calculate point on circle
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    // Draw marker
    analyserCtx.fillStyle = 'rgba(255, 255, 100, 0.8)';
    analyserCtx.beginPath();
    analyserCtx.arc(x, y, 4, 0, Math.PI * 2);
    analyserCtx.fill();
    
    // Draw crystal name
    const labelX = centerX + Math.cos(angle) * (radius - 20);
    const labelY = centerY + Math.sin(angle) * (radius - 20);
    
    analyserCtx.fillStyle = 'rgba(255, 255, 100, 0.8)';
    analyserCtx.save();
    analyserCtx.translate(labelX, labelY);
    analyserCtx.rotate(angle + Math.PI/2);
    analyserCtx.fillText(crystal, 0, 0);
    analyserCtx.restore();
  }
}
