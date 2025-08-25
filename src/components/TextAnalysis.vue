<!-- src/components/TextAnalysis.vue -->
<template>
  <div class="text-analysis-container">
    <div class="header">
      <h1 class="title">Review Engagement Graph</h1>
    </div>

    <!-- 檔案上傳區 -->
    <div class="upload-section">
      <div 
        class="upload-area"
        :class="{ 
          'drag-over': isDragOver,
          'has-file': selectedFile,
          'upload-success': uploadSuccess
        }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleFileDrop"
        @click="triggerFileInput"
      >
        <input 
          ref="fileInput" 
          type="file" 
          accept=".json"
          style="display: none"
          @change="handleFileSelect"
        />
        
        <div class="upload-content">
          <div v-if="!selectedFile && !uploadSuccess" class="upload-placeholder">
            <div class="upload-icon">📁</div>
            <div class="upload-text">點擊或拖拽檔案至此上傳</div>
          </div>
          
          <div v-else-if="selectedFile && !uploadSuccess" class="file-info">
            <div class="file-details">
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
              <button class="remove-btn" @click.stop="removeFile">×</button>
            </div>
          </div>

          <div v-else-if="uploadSuccess" class="upload-success-info">
            <div class="success-icon">✅</div>
            <div class="success-text">檔案上傳成功！</div>
            <div class="upload-details" v-if="uploadResult">
              <div class="detail-item">
                <strong>檔案位置:</strong> {{ uploadResult.data?.name || 'N/A' }}
              </div>
              <div class="detail-item" v-if="uploadResult.data?.public_url">
                <strong>公開連結:</strong> 
                <a :href="uploadResult.data.public_url" target="_blank" class="url-link">
                  查看檔案
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="analysisError" class="error-message">
        {{ analysisError }}
      </div>
    </div>

    <!-- 處理按鈕 -->
    <div class="process-section">
      <button 
        class="process-btn"
        :disabled="!selectedFile || analyzing || !apiConnected"
        @click="performAnalysis"
      >
        <span v-if="analyzing" class="loading">
          <div class="spinner"></div>
          處理中...
        </span>
        <span v-else>進行資料處理</span>
      </button>
      
      <!-- API 連接狀態 -->
      <div class="connection-status">
        <span :class="apiConnected ? 'connected' : 'disconnected'">
          {{ apiConnected ? '✅ API 已連接' : '❌ API 未連接' }}
        </span>
        <button class="test-btn" @click="testConnection">測試連接</button>
      </div>
    </div>

    <!-- 分類標籤區 -->
    <div class="filter-section">
      <div class="filter-tabs">
        <button class="tab active">All</button>
        <button class="tab">Relevance</button>
        <button class="tab">Concreteness</button>
        <button class="tab">Constructive</button>
      </div>
    </div>

    <!-- 結果顯示區 -->
    <div v-if="analysisResults" class="results-section">
      <div class="results-header">
        <h2>分析結果</h2>
        <div class="results-actions">
          <button @click="exportResultsAsJSON" class="export-btn">導出 JSON</button>
          <button @click="clearResults" class="clear-btn">清除結果</button>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div class="statistics">
        <div class="stat-card">
          <div class="stat-value">{{ totalTexts }}</div>
          <div class="stat-label">總計</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statisticsData.relevance }}</div>
          <div class="stat-label">相關性</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statisticsData.concreteness }}</div>
          <div class="stat-label">具體性</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statisticsData.constructive }}</div>
          <div class="stat-label">建設性</div>
        </div>
      </div>

      <!-- 原始 JSON 結果 -->
      <div class="json-results">
        <h3>原始回應資料</h3>
        <pre class="json-display">{{ JSON.stringify(analysisResults, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTextAnalysis } from '@/composables/useTextAnalysis'

const {
  selectedFile,
  analyzing,
  analysisResults,
  analysisError,
  apiConnected,
  totalTexts,
  statisticsData,
  testConnection,
  handleFileSelect: composableHandleFileSelect,
  performAnalysis: originalPerformAnalysis, // 重新命名避免衝突
  exportResultsAsJSON,
  clearResults,
  init
} = useTextAnalysis()

// 本地響應式狀態
const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const uploadSuccess = ref(false)
const uploadResult = ref<any>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  uploadSuccess.value = false
  uploadResult.value = null
  await composableHandleFileSelect(file)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleFileDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    uploadSuccess.value = false
    uploadResult.value = null
    await composableHandleFileSelect(file)
  }
}

const removeFile = () => {
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  uploadSuccess.value = false
  uploadResult.value = null
  composableHandleFileSelect(null)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 包裝後的 performAnalysis 函數，加上上傳成功狀態
const performAnalysis = async () => {
  const result = await originalPerformAnalysis()
  if (result && analysisResults.value) {
    // 檢查是否有上傳資訊
    if (analysisResults.value.upload_info) {
      uploadSuccess.value = true
      uploadResult.value = analysisResults.value
    }
  }
  return result
}

onMounted(async () => {
  await init()
})
</script>

<style scoped>
/* 基本容器樣式 */
.text-analysis-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

/* 檔案上傳區樣式 */
.upload-section {
  margin-bottom: 30px;
}

.upload-area {
  border: 3px dashed #e0e0e0;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #3498db;
  background: #f0f8ff;
}

.upload-area.drag-over {
  border-color: #2980b9;
  background: #e3f2fd;
  transform: scale(1.02);
}

.upload-area.has-file {
  border-color: #27ae60;
  background: #f0fff4;
}

.upload-area.upload-success {
  border-color: #27ae60;
  background: #f0fff4;
}

.upload-content {
  width: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 3rem;
  opacity: 0.6;
}

.upload-text {
  font-size: 1.2rem;
  color: #7f8c8d;
  font-weight: 500;
}

.file-info {
  display: flex;
  justify-content: center;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.file-name {
  font-weight: 600;
  color: #2c3e50;
}

.file-size {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.remove-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1;
}

.remove-btn:hover {
  background: #c0392b;
}

.upload-success-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.success-icon {
  font-size: 3rem;
}

.success-text {
  font-size: 1.3rem;
  color: #27ae60;
  font-weight: 600;
}

.upload-details {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: left;
}

.detail-item {
  margin-bottom: 8px;
  color: #2c3e50;
}

.url-link {
  color: #3498db;
  text-decoration: none;
  margin-left: 8px;
}

.url-link:hover {
  text-decoration: underline;
}

.error-message {
  background: #ffe6e6;
  color: #e74c3c;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 15px;
  border-left: 4px solid #e74c3c;
}

/* 處理按鈕區樣式 */
.process-section {
  text-align: center;
  margin-bottom: 30px;
}

.process-btn {
  background: #6c5ce7;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 15px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.process-btn:hover:not(:disabled) {
  background: #5f4bdb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
}

.process-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 0.9rem;
}

.connected {
  color: #27ae60;
}

.disconnected {
  color: #e74c3c;
}

.test-btn {
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 0.8rem;
  cursor: pointer;
}

.test-btn:hover {
  background: #7f8c8d;
}

/* 分類標籤區樣式 */
.filter-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.filter-tabs {
  display: flex;
  background: white;
  border-radius: 25px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

.tab {
  background: transparent;
  border: none;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  color: #7f8c8d;
  transition: all 0.3s ease;
}

.tab.active {
  background: #74b9ff;
  color: white;
}

.tab:hover:not(.active) {
  background: #f8f9fa;
  color: #2c3e50;
}

/* 結果區樣式 */
.results-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.results-header h2 {
  margin: 0;
  color: #2c3e50;
}

.results-actions {
  display: flex;
  gap: 10px;
}

.export-btn, .clear-btn {
  background: #74b9ff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9rem;
}

.clear-btn {
  background: #e17055;
}

.export-btn:hover {
  background: #0984e3;
}

.clear-btn:hover {
  background: #d63031;
}

.statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.json-results {
  margin-top: 30px;
}

.json-results h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.json-display {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  max-height: 400px;
  overflow-y: auto;
}
</style>
