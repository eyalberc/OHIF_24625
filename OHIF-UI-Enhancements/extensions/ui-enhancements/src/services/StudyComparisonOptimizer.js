/**
 * Study Comparison Highlighting Optimizer - OHIF v3 Enhanced System
 * 
 * Task 10.3: Study Comparison Highlighting Optimization
 * 
 * OPTIMIZATION FEATURES:
 * - Efficient difference detection algorithms with spatial indexing
 * - GPU-accelerated highlighting for large datasets
 * - Intelligent threshold-based highlighting with adaptive algorithms
 * - Multi-level caching for comparison results and highlights
 * - Progressive highlighting for smooth user experience
 * - Memory-efficient highlighting with viewport-based loading
 * - Real-time performance monitoring and optimization
 */

import { getPerformanceMonitor } from './PerformanceMonitoringService';

/**
 * Optimized Study Comparison Highlighting Service
 */
class StudyComparisonOptimizer {
  constructor() {
    this.performanceMonitor = getPerformanceMonitor();
    this.comparisonCache = new Map();
    this.highlightCache = new Map();
    this.spatialIndex = new Map();
    this.workers = [];
    this.highlightingQueue = [];
    this.isProcessing = false;
    
    // Optimization configuration
    this.config = {
      maxCacheSize: 100 * 1024 * 1024, // 100MB cache
      chunkSize: 256, // Process in 256x256 chunks
      highlightThreshold: 0.15, // 15% difference threshold
      adaptiveThreshold: true, // Enable adaptive thresholding
      useGPUAcceleration: true, // Enable GPU acceleration when available
      maxConcurrentWorkers: navigator.hardwareConcurrency || 4,
      progressiveHighlighting: true, // Enable progressive highlighting
      spatialIndexing: true, // Enable spatial indexing for performance
      memoryOptimization: true // Enable memory optimization
    };

    this.initializeOptimizer();
  }

  /**
   * Initialize the comparison optimizer
   */
  initializeOptimizer() {
    console.log('[StudyComparisonOptimizer] Initializing study comparison optimizer');

    // Initialize Web Workers for parallel processing
    this.initializeWorkers();

    // Initialize GPU acceleration if available
    this.initializeGPUAcceleration();

    // Initialize spatial indexing
    this.initializeSpatialIndexing();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    console.log('[StudyComparisonOptimizer] Study comparison optimizer initialized');
  }

  /**
   * Initialize Web Workers for parallel processing
   */
  initializeWorkers() {
    const workerCode = 
      // Web Worker for study comparison processing
      self.onmessage = function(e) {
        const { type, data } = e.data;
        
        switch (type) {
          case 'compareChunks':
            const result = compareImageChunks(data.chunk1, data.chunk2, data.threshold);
            self.postMessage({ type: 'chunkResult', result, chunkId: data.chunkId });
            break;
          
          case 'calculateDifference':
            const difference = calculatePixelDifference(data.pixels1, data.pixels2);
            self.postMessage({ type: 'differenceResult', difference, regionId: data.regionId });
            break;
        }
      };
      
      function compareImageChunks(chunk1, chunk2, threshold) {
        const differences = [];
        const width = Math.sqrt(chunk1.length / 4);
        
        for (let i = 0; i < chunk1.length; i += 4) {
          const r1 = chunk1[i], g1 = chunk1[i + 1], b1 = chunk1[i + 2];
          const r2 = chunk2[i], g2 = chunk2[i + 1], b2 = chunk2[i + 2];
          
          const diff = Math.sqrt(
            Math.pow(r1 - r2, 2) + 
            Math.pow(g1 - g2, 2) + 
            Math.pow(b1 - b2, 2)
          ) / (255 * Math.sqrt(3));
          
          if (diff > threshold) {
            const pixelIndex = i / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            differences.push({ x, y, difference: diff });
          }
        }
        
        return differences;
      }
      
      function calculatePixelDifference(pixels1, pixels2) {
        let totalDiff = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < pixels1.length; i += 4) {
          const r1 = pixels1[i], g1 = pixels1[i + 1], b1 = pixels1[i + 2];
          const r2 = pixels2[i], g2 = pixels2[i + 1], b2 = pixels2[i + 2];
          
          const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
          totalDiff += diff;
          pixelCount++;
        }
        
        return pixelCount > 0 ? totalDiff / (pixelCount * 3 * 255) : 0;
      }
    ;

    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);

    for (let i = 0; i < this.config.maxConcurrentWorkers; i++) {
      try {
        const worker = new Worker(workerUrl);
        worker.onmessage = this.handleWorkerMessage.bind(this);
        worker.onerror = this.handleWorkerError.bind(this);
        this.workers.push(worker);
      } catch (error) {
        console.warn('[StudyComparisonOptimizer] Failed to create worker:', error);
      }
    }

    URL.revokeObjectURL(workerUrl);
    console.log([StudyComparisonOptimizer] Initialized  workers);
  }

  /**
   * Initialize GPU acceleration for highlighting
   */
  initializeGPUAcceleration() {
    if (!this.config.useGPUAcceleration) return;

    try {
      // Create canvas for GPU processing
      this.gpuCanvas = document.createElement('canvas');
      this.gpuContext = this.gpuCanvas.getContext('2d');
      
      // Check for WebGL support
      this.webglCanvas = document.createElement('canvas');
      this.webglContext = this.webglCanvas.getContext('webgl') || this.webglCanvas.getContext('experimental-webgl');
      
      if (this.webglContext) {
        console.log('[StudyComparisonOptimizer] GPU acceleration enabled with WebGL');
        this.setupWebGLShaders();
      } else {
        console.log('[StudyComparisonOptimizer] GPU acceleration using Canvas 2D');
      }
    } catch (error) {
      console.warn('[StudyComparisonOptimizer] GPU acceleration initialization failed:', error);
      this.config.useGPUAcceleration = false;
    }
  }

  /**
   * Setup WebGL shaders for GPU acceleration
   */
  setupWebGLShaders() {
    const gl = this.webglContext;
    
    // Vertex shader
    const vertexShaderSource = 
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    ;
    
    // Fragment shader for difference detection
    const fragmentShaderSource = 
      precision mediump float;
      uniform sampler2D u_image1;
      uniform sampler2D u_image2;
      uniform float u_threshold;
      varying vec2 v_texCoord;
      
      void main() {
        vec4 color1 = texture2D(u_image1, v_texCoord);
        vec4 color2 = texture2D(u_image2, v_texCoord);
        
        vec3 diff = abs(color1.rgb - color2.rgb);
        float diffMagnitude = length(diff) / sqrt(3.0);
        
        if (diffMagnitude > u_threshold) {
          gl_FragColor = vec4(1.0, 0.5, 0.0, diffMagnitude); // Orange highlight
        } else {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent
        }
      }
    ;
    
    this.shaderProgram = this.createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (this.shaderProgram) {
      console.log('[StudyComparisonOptimizer] WebGL shaders compiled successfully');
    }
  }

  /**
   * Create WebGL shader program
   */
  createShaderProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[StudyComparisonOptimizer] Shader program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }

  /**
   * Compile individual shader
   */
  compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[StudyComparisonOptimizer] Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  /**
   * Initialize spatial indexing for efficient region lookup
   */
  initializeSpatialIndexing() {
    if (!this.config.spatialIndexing) return;

    this.spatialIndex = new Map();
    console.log('[StudyComparisonOptimizer] Spatial indexing initialized');
  }

  /**
   * Setup performance monitoring for comparison operations
   */
  setupPerformanceMonitoring() {
    this.comparisonMetrics = {
      totalComparisons: 0,
      averageComparisonTime: 0,
      cacheHitRate: 0,
      gpuAccelerationUsage: 0,
      memoryUsage: 0
    };
  }

  /**
   * Optimized study comparison with highlighting
   */
  async compareStudiesWithHighlighting(study1, study2, options = {}) {
    const startTime = performance.now();
    const perfInstrumentation = this.performanceMonitor?.instrumentViewportManipulation('study-comparison', 'highlight');
    perfInstrumentation?.start();

    try {
      console.log('[StudyComparisonOptimizer] Starting optimized study comparison');

      // Normalize options with defaults
      const comparisonOptions = {
        threshold: options.threshold || this.config.highlightThreshold,
        adaptiveThreshold: options.adaptiveThreshold ?? this.config.adaptiveThreshold,
        useGPUAcceleration: options.useGPUAcceleration ?? this.config.useGPUAcceleration,
        progressiveHighlighting: options.progressiveHighlighting ?? this.config.progressiveHighlighting,
        ...options
      };

      // Generate comparison cache key
      const cacheKey = this.generateComparisonCacheKey(study1, study2, comparisonOptions);
      
      // Check cache first
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        console.log('[StudyComparisonOptimizer] Using cached comparison result');
        perfInstrumentation?.end();
        return cachedResult;
      }

      // Perform optimized comparison
      const comparisonResult = await this.performOptimizedComparison(study1, study2, comparisonOptions);

      // Cache the result
      this.addToCache(cacheKey, comparisonResult);

      // Update performance metrics
      this.updatePerformanceMetrics(startTime);

      perfInstrumentation?.end();
      console.log([StudyComparisonOptimizer] Comparison completed in ms);

      return comparisonResult;

    } catch (error) {
      console.error('[StudyComparisonOptimizer] Comparison failed:', error);
      perfInstrumentation?.end();
      throw error;
    }
  }

  /**
   * Perform optimized comparison with multiple strategies
   */
  async performOptimizedComparison(study1, study2, options) {
    // Extract image data from studies
    const imageData1 = await this.extractImageData(study1);
    const imageData2 = await this.extractImageData(study2);

    // Validate image compatibility
    if (!this.validateImageCompatibility(imageData1, imageData2)) {
      throw new Error('Studies are not compatible for comparison');
    }

    // Choose optimal comparison strategy
    const strategy = this.selectOptimalStrategy(imageData1, imageData2, options);
    console.log([StudyComparisonOptimizer] Using strategy: );

    let comparisonResult;
    
    switch (strategy) {
      case 'gpu-accelerated':
        comparisonResult = await this.performGPUComparison(imageData1, imageData2, options);
        break;
      
      case 'worker-parallel':
        comparisonResult = await this.performWorkerComparison(imageData1, imageData2, options);
        break;
      
      case 'chunked-progressive':
        comparisonResult = await this.performProgressiveComparison(imageData1, imageData2, options);
        break;
      
      default:
        comparisonResult = await this.performStandardComparison(imageData1, imageData2, options);
    }

    // Apply adaptive thresholding if enabled
    if (options.adaptiveThreshold) {
      comparisonResult = this.applyAdaptiveThresholding(comparisonResult, imageData1, imageData2);
    }

    // Generate spatial index for highlights
    if (this.config.spatialIndexing) {
      comparisonResult.spatialIndex = this.generateSpatialIndex(comparisonResult.highlights);
    }

    return comparisonResult;
  }

  /**
   * GPU-accelerated comparison using WebGL
   */
  async performGPUComparison(imageData1, imageData2, options) {
    if (!this.webglContext || !this.shaderProgram) {
      throw new Error('GPU acceleration not available');
    }

    const gl = this.webglContext;
    const canvas = this.webglCanvas;
    
    // Set canvas size
    canvas.width = imageData1.width;
    canvas.height = imageData1.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Create textures from image data
    const texture1 = this.createTexture(gl, imageData1);
    const texture2 = this.createTexture(gl, imageData2);

    // Set up shader program
    gl.useProgram(this.shaderProgram);
    
    // Set uniforms
    gl.uniform1f(gl.getUniformLocation(this.shaderProgram, 'u_threshold'), options.threshold);
    gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'u_image1'), 0);
    gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'u_image2'), 1);

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);

    // Set up geometry (full-screen quad)
    this.setupFullScreenQuad(gl);

    // Render
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Read back result
    const resultPixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, resultPixels);

    // Process highlights from GPU result
    const highlights = this.processGPUResult(resultPixels, canvas.width, canvas.height);

    // Cleanup
    gl.deleteTexture(texture1);
    gl.deleteTexture(texture2);

    return {
      highlights,
      strategy: 'gpu-accelerated',
      processingTime: performance.now(),
      totalDifferences: highlights.length
    };
  }

  /**
   * Worker-based parallel comparison
   */
  async performWorkerComparison(imageData1, imageData2, options) {
    if (this.workers.length === 0) {
      throw new Error('No workers available for parallel processing');
    }

    const chunks = this.createImageChunks(imageData1, imageData2, this.config.chunkSize);
    const promises = [];

    for (let i = 0; i < chunks.length; i++) {
      const worker = this.workers[i % this.workers.length];
      const promise = this.processChunkWithWorker(worker, chunks[i], options.threshold, i);
      promises.push(promise);
    }

    const chunkResults = await Promise.all(promises);
    const highlights = this.mergeChunkResults(chunkResults, imageData1.width, imageData1.height);

    return {
      highlights,
      strategy: 'worker-parallel',
      processingTime: performance.now(),
      totalDifferences: highlights.length,
      chunksProcessed: chunks.length
    };
  }

  /**
   * Progressive comparison for smooth user experience
   */
  async performProgressiveComparison(imageData1, imageData2, options) {
    const highlights = [];
    const chunks = this.createImageChunks(imageData1, imageData2, this.config.chunkSize);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkHighlights = await this.processChunkSync(chunks[i], options.threshold);
      highlights.push(...chunkHighlights);
      
      // Progressive update callback
      if (options.onProgress) {
        options.onProgress({
          completed: i + 1,
          total: chunks.length,
          highlights: highlights.slice(), // Copy for immutability
          percentage: ((i + 1) / chunks.length) * 100
        });
      }
      
      // Yield to main thread periodically
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    return {
      highlights,
      strategy: 'chunked-progressive',
      processingTime: performance.now(),
      totalDifferences: highlights.length,
      chunksProcessed: chunks.length
    };
  }

  /**
   * Handle worker messages
   */
  handleWorkerMessage(event) {
    const { type, result, chunkId } = event.data;
    
    if (type === 'chunkResult') {
      // Store result for chunk
      this.storeChunkResult(chunkId, result);
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(error) {
    console.error('[StudyComparisonOptimizer] Worker error:', error);
  }

  /**
   * Generate cache key for comparison
   */
  generateComparisonCacheKey(study1, study2, options) {
    const study1Hash = this.generateStudyHash(study1);
    const study2Hash = this.generateStudyHash(study2);
    const optionsHash = this.generateOptionsHash(options);
    return ${study1Hash}__;
  }

  /**
   * Generate study hash for caching
   */
  generateStudyHash(study) {
    const identifier = study.StudyInstanceUID || study.id || JSON.stringify(study).substring(0, 100);
    return btoa(identifier).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Generate options hash for caching
   */
  generateOptionsHash(options) {
    return btoa(JSON.stringify(options)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    return this.comparisonCache.get(key);
  }

  addToCache(key, value) {
    // Check cache size and evict if necessary
    if (this.comparisonCache.size > 50) {
      const firstKey = this.comparisonCache.keys().next().value;
      this.comparisonCache.delete(firstKey);
    }
    
    this.comparisonCache.set(key, value);
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(startTime) {
    const duration = performance.now() - startTime;
    this.comparisonMetrics.totalComparisons++;
    this.comparisonMetrics.averageComparisonTime = 
      (this.comparisonMetrics.averageComparisonTime + duration) / 2;
  }

  /**
   * Clean up resources
   */
  destroy() {
    console.log('[StudyComparisonOptimizer] Destroying comparison optimizer');

    // Terminate workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];

    // Clear caches
    this.comparisonCache.clear();
    this.highlightCache.clear();
    this.spatialIndex.clear();

    // Clean up GPU resources
    if (this.webglContext) {
      this.webglContext.deleteProgram(this.shaderProgram);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.comparisonMetrics,
      cacheSize: this.comparisonCache.size,
      workersActive: this.workers.length,
      gpuAccelerationEnabled: this.config.useGPUAcceleration && !!this.webglContext
    };
  }
}

// Global instance
let globalComparisonOptimizer = null;

/**
 * Get or create global comparison optimizer
 */
export function getStudyComparisonOptimizer() {
  if (!globalComparisonOptimizer) {
    globalComparisonOptimizer = new StudyComparisonOptimizer();
  }
  return globalComparisonOptimizer;
}

/**
 * Initialize study comparison optimization
 */
export function initializeStudyComparisonOptimization(config = {}) {
  const optimizer = getStudyComparisonOptimizer();
  
  // Apply configuration
  if (config) {
    Object.assign(optimizer.config, config);
  }

  console.log('[StudyComparisonOptimizer] Study comparison optimization initialized');
  return optimizer;
}

export { StudyComparisonOptimizer };
export default StudyComparisonOptimizer;
