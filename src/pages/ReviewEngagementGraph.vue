<template>
  <div class="review-engagement-graph">
    <h1>Review Engagement Graph</h1>
    
    <!-- 上傳檔案區域 -->
    <div class="upload-file-section">
      <div class="upload-section-container">
        <h3 class="upload-section-title">上傳檔案區</h3>
        
        <div class="upload-area-wrapper">
          <div class="upload-area" 
               :class="{ 
                 'drag-over': isDragOver,
                 'has-file': uploadedFile,
                 'upload-success': uploadedFile && uploadStatus?.type === 'success'
               }"
               @dragover.prevent="handleDragOver"
               @dragleave.prevent="handleDragLeave"
               @drop.prevent="handleFileDrop"
               @click="triggerFileInput">
            
            <!-- 檔案輸入 -->
            <input 
              ref="fileInput"
              type="file" 
              accept=".json"
              @change="handleFileSelect"
              style="display: none;"
            />
            
            <!-- 上傳區域顯示 -->
            <div v-if="!uploadedFile" class="upload-placeholder">
              <div class="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M7 18a4.6 4.4 0 0 1 0-9 5 5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7H7z"/>
                  <path d="m9 15 3-3 3 3"/>
                  <path d="M12 12v9"/>
                </svg>
              </div>
              <p class="upload-text">點擊或拖曳檔案到此處</p>
              <p class="upload-hint">支援 JSON 格式檔案</p>
            </div>
            
            <!-- 已上傳檔案顯示 -->
            <div v-else class="uploaded-file-info">
              <div class="file-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3 8-8"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.306 0 2.54.279 3.66.775"/>
                </svg>
              </div>
              <p class="file-name">{{ uploadedFile.name }}</p>
              <p class="file-size">{{ formatFileSize(uploadedFile.size) }}</p>
              <button @click.stop="removeFile" class="remove-btn">重新選擇檔案</button>
            </div>
          </div>
          
          <!-- 錯誤狀態 -->
          <div v-if="uploadStatus?.type === 'error'" class="upload-error-message">
            <div class="error-icon">✗</div>
            <span>{{ uploadStatus.message }}</span>
          </div>

          <!-- 上傳檔案到後端按鈕 -->
          <div v-if="uploadedFile && !isUploading" class="upload-to-backend-section">
            <button
              @click="uploadFileToBackend"
              class="upload-to-backend-btn"
              :disabled="!uploadedFile || isUploading"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              上傳檔案到後端
            </button>
          </div>

          <!-- 上傳中狀態 -->
          <div v-if="isUploading" class="uploading-indicator">
            <div class="upload-spinner"></div>
            <p>正在上傳到後端...</p>
          </div>

          <!-- 上傳到後端成功訊息 -->
          <div v-if="backendUploadResult" class="backend-upload-success">
            <div class="success-icon">✓</div>
            <div class="upload-result-content">
              <p class="upload-result-title">檔案已成功上傳到 Firebase Storage！</p>
              <div class="upload-result-details">
                <p><strong>檔案路徑:</strong> {{ backendUploadResult.data?.name }}</p>
                <p v-if="backendUploadResult.data?.public_url">
                  <strong>公開連結:</strong> 
                  <a :href="backendUploadResult.data.public_url" target="_blank" class="upload-link">
                    查看檔案
                  </a>
                </p>
                <p v-else-if="backendUploadResult.data?.gs_uri">
                  <strong>Storage URI:</strong> {{ backendUploadResult.data.gs_uri }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 進行資料處理區域 -->
    <div class="processing-section">
      <!-- 處理按鈕 -->
      <button
        v-if="uploadedFile && !isProcessing"
        @click="sendJSONPayload"
        class="process-btn"
        :disabled="!uploadedFile"
      >
        🔮 推論分析並生成圖表
      </button>
      
      <!-- 處理中狀態 -->
      <div v-if="isProcessing" class="processing-indicator">
        <div class="spinner"></div>
        <p>使用 Firebase SDK 推論分析中...</p>
      </div>
    </div>
    
    <!-- Vue 控制的模式切換按鈕 -->
    <div class="switch-bar">
      <button 
        v-for="mode in modes" 
        :key="mode.value"
        :class="['switch-btn', { active: currentMode === mode.value }]"
        @click="updateGraphMode(mode.value)"
      >
        {{ mode.label }}
      </button>
    </div>

    <!-- 主圖表與控制面板 -->
    <div id="review-graph-container">
      <div class="floating-panel">
        <label for="hw-select" class="assignment-label">Assignment</label>
        <button @click="applySelection" id="hw-apply-btn">生成圖表</button>
        <select 
          id="hw-select" 
          v-model="selectedHW" 
          multiple 
          size="5"
        >
          <option 
            v-for="hw in availableHW" 
            :key="hw" 
            :value="hw"
          >
            {{ hw }}
          </option>
        </select>
      </div>
      <div id="review-graph"></div>
    </div>

    <!-- Bubble Chart 區塊 -->
    <div class="bubble-chart-section">
      <h2>🫧 全班作業審查狀況多維氣泡圖</h2>
      <p class="bubble-description">
        X軸為品質指標（相關性、具體性、建設性、總和），Y軸為學生<br>
        氣泡大小為審查參與度（完成Assignment數/分配Assignment數），顏色深淺為該標籤比例<br>
        <small class="note">※ 單一標籤比例可能超過100%，因為一個評論可能同時有多個標籤</small><br>
        <small class="sub-note">※ 網路圖節點大小也使用相同的審查參與度計算，方便比較學生作業完成狀況</small>
      </p>
      
      <!-- Vue 控制的匯出按鈕 -->
      <div class="export-controls">
        <button @click="exportBubbleChart('normal')" class="export-btn">
          💾 匯出氣泡圖為 PNG
        </button>
        <button @click="exportBubbleChart('high-res')" class="export-btn">
          📸 匯出高解析度 PNG
        </button>
      </div>
      
      <!-- Bubble Chart 圖表 -->
      <div class="bubble-chart-container">
        <canvas id="bubbleChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { textAnalysisAPI } from '@/services/textAnalysisAPI'
import { UploadFileAPI } from '@/services/uploadFileAPI'

// 創建上傳 API 實例
const uploadAPI = new UploadFileAPI()

// 定義 props
interface Props {
  dataUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  dataUrl: '/api/function/3labeled_processed_totalData.json'
})

// Vue 響應式數據
const currentMode = ref('all')
const selectedHW = ref<string[]>([])
const availableHW = ref<string[]>([])
const rawData = ref<any>(null)
const bubbleChartManager = ref<any>(null)
const isInitialized = ref(false)

// 檔案上傳相關響應式數據
const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const isDragOver = ref(false)
const uploadStatus = ref<{type: string, message: string} | null>(null)
const isProcessing = ref(false)
const isUploading = ref(false)
const backendUploadResult = ref<any>(null)

const modes = [
  { value: 'all', label: 'All' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'concreteness', label: 'Concreteness' },
  { value: 'constructive', label: 'Constructive' }
]

// 導入原有的 JavaScript 模組（這些會在後面設置）
let originalFunctions: any = {}

// 檔案上傳相關函數
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleDragOver = (_event: DragEvent) => {
  isDragOver.value = true
}

const handleDragLeave = (_event: DragEvent) => {
  isDragOver.value = false
}

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    validateAndSetFile(files[0])
  }
}

const validateAndSetFile = (file: File) => {
  // 檢查檔案類型
  if (!file.name.toLowerCase().endsWith('.json')) {
    showUploadStatus('error', '請選擇 JSON 格式的檔案')
    return
  }
  
  // 檢查檔案大小 (限制 25MB)
  if (file.size > 25 * 1024 * 1024) {
    showUploadStatus('error', '檔案大小不能超過 25MB')
    return
  }
  
  uploadedFile.value = file
  // 清除之前的後端上傳結果
  backendUploadResult.value = null
  showUploadStatus('success', '檔案選擇成功！')
}

const removeFile = () => {
  uploadedFile.value = null
  uploadStatus.value = null
  backendUploadResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 新增：上傳檔案到後端的函數
const uploadFileToBackend = async () => {
  if (!uploadedFile.value) {
    showUploadStatus('error', '請先選擇檔案')
    return
  }

  isUploading.value = true
  try {
    console.log('🚀 開始上傳檔案到後端:', uploadedFile.value.name)
    
    // 使用 uploadFileAPI 進行上傳
    const result = await uploadAPI.uploadToFirebase(
      uploadedFile.value, 
      { destination: `data/${uploadedFile.value.name}` }
    )
    
    if (result.success) {
      backendUploadResult.value = result
      showUploadStatus('success', '檔案已成功上傳到 Firebase Storage！')
      console.log('✅ 檔案上傳成功，資料結構:', result.data)
    } else {
      throw new Error(result.error || '上傳失敗')
    }
  } catch (error: any) {
    console.error('❌ 檔案上傳失敗:', error)
    showUploadStatus('error', `上傳失敗: ${error.message}`)
    backendUploadResult.value = null
  } finally {
    isUploading.value = false
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const showUploadStatus = (type: string, message: string) => {
  uploadStatus.value = { type, message }
  setTimeout(() => {
    if (uploadStatus.value && uploadStatus.value.message === message) {
      uploadStatus.value = null
    }
  }, 5000)
}

// 將後端/本地 JSON 轉換為舊格式 (hw -> array of original assignments) 的輔助函式
const normalizeBackendData = (data: any) => {
  try {
    if (!data || typeof data !== 'object') return null;

    // 將單一陣列做標準化的輔助
    const extractArray = (arr: any) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => {
        const original = (item && item.original_data && item.original_data.original)
          ? item.original_data.original
          : item;
        const merged = { ...(original || {}) };
        // 將 predictions 合併到 assignment 上，後續用於顏色/分數計算的 fallback
        if (item && item.predictions) merged.__predictions = item.predictions;
        return merged;
      });
    };

    // 格式1：{ data: { results: { HW1: [...] } } }
    if (data.data && data.data.results && typeof data.data.results === 'object') {
      const converted: Record<string, any[]> = {};
      Object.keys(data.data.results).forEach((hw) => {
        converted[hw] = extractArray(data.data.results[hw]);
      });
      return converted;
    }

    // 格式2：{ results: { HW1: [...] } }
    if (data.results && typeof data.results === 'object') {
      const converted: Record<string, any[]> = {};
      Object.keys(data.results).forEach((hw) => {
        converted[hw] = extractArray(data.results[hw]);
      });
      return converted;
    }

    // 格式3：已是舊格式 (第一個 key 的值是陣列)
    const keys = Object.keys(data);
    if (keys.length > 0 && Array.isArray(data[keys[0]])) {
      return data;
    }

    return null;
  } catch (err) {
    console.warn('normalizeBackendData 發生錯誤：', err);
    return null;
  }
}

const sendJSONPayload = async () => {
  if (!uploadedFile.value) {
    showUploadStatus('error', '請先上傳或選擇 JSON 檔案')
    return
  }

  isProcessing.value = true
  try {
    console.log('🚀 開始使用 Firebase SDK 進行完整推論流程...')
    
    // 檢查是否已經上傳到後端
    if (!backendUploadResult.value) {
      showUploadStatus('error', '請先點擊「上傳檔案到後端」按鈕')
      return
    }

    // 從後端上傳結果中取得檔案路徑
    const uploadedFileName = (backendUploadResult.value.data as any)?.data?.name || (backendUploadResult.value.data as any)?.name
    if (!uploadedFileName) {
      throw new Error('無法取得上傳檔案的路徑')
    }

    console.log('📁 使用已上傳的檔案進行推論:', uploadedFileName)
    showUploadStatus('info', '正在進行推論...')

    // 使用新的推論 API (不傳送 verbose 參數，使用後端預設行為)
    const inferenceResult = await textAnalysisAPI.inferenceFromStorage(uploadedFileName)

    if (!inferenceResult.success) {
      throw new Error(inferenceResult.error || '推論失敗')
    }

    console.log('🔮 推論完成，後端回應結構:', inferenceResult.data)
    console.log('📍 預期回應格式: { status: "success", data: { output: { bucket, name, gs_uri } } }')

    // 檢查是否有推論結果輸出檔案位置資訊
    if (inferenceResult.data?.output) {
      console.log('� 使用 Firebase SDK 下載推論結果檔案...')
      showUploadStatus('info', '正在使用 Firebase SDK 下載推論結果 (避免 CORS 限制)...')
      
      // 使用 Firebase SDK 下載推論結果
      const downloadResult = await textAnalysisAPI.downloadInferenceResult(inferenceResult.data.output)
      
      if (downloadResult.success) {
        console.log('✅ 成功使用 Firebase SDK 下載推論結果檔案')
        console.log('📊 下載的檔案內容 (原始):', downloadResult.data)
        console.log('📊 檔案內容資料類型:', typeof downloadResult.data)
        console.log('📊 檔案內容鍵值:', Object.keys(downloadResult.data || {}))
        
        // 這應該是純粹的推論結果 JSON，不是包裝在 response 中
        let actualData = downloadResult.data
        
        // 如果下載的是 API response 格式（有 status 和 data），提取實際資料
        if (actualData && typeof actualData === 'object' && actualData.status && actualData.data) {
          console.log('🔍 偵測到 API response 格式，提取實際資料...')
          console.log('📊 Response status:', actualData.status)
          console.log('📊 Response data:', actualData.data)
          actualData = actualData.data
        }
        
        // 如果還是有嵌套的 data，繼續提取
        if (actualData && typeof actualData === 'object' && actualData.data && !Array.isArray(actualData)) {
          console.log('🔍 發現嵌套的 data 欄位，繼續提取...')
          actualData = actualData.data
        }
        
        console.log('📊 最終提取的實際資料:', actualData)
        console.log('📊 實際資料類型:', typeof actualData)
        console.log('📊 實際資料鍵值:', Object.keys(actualData || {}))
        
        // 正規化後端回傳資料為舊格式
        let finalData = actualData
        const normalized = normalizeBackendData(actualData)
        if (normalized) {
          finalData = normalized
          console.log('🔧 資料已正規化為舊格式')
          console.log('🔧 正規化後的資料鍵值:', Object.keys(finalData))
        } else {
          console.log('⚠️ 資料無法正規化，使用原始資料')
        }

        // 設置資料到全域變數，供原本的 script 使用
        rawData.value = finalData
        availableHW.value = Object.keys(finalData).sort()
        selectedHW.value = [...availableHW.value] // 預設全選
        
        console.log('📋 可用作業列表:', availableHW.value)
        console.log('✅ 資料已準備完成，準備生成圖表')
        
        // 自動觸發圖表更新
        await nextTick() // 確保 DOM 更新完成
        
        // 呼叫原本的圖表生成函數
        if (originalFunctions.generateAllGraph && typeof originalFunctions.generateAllGraph === 'function') {
          console.log('🎨 自動生成圖表...')
          updateGraphMode('all') // 預設顯示 All 模式
          showUploadStatus('success', '✅ Firebase SDK 解析完成並已自動生成圖表！')
        } else {
          showUploadStatus('success', '✅ Firebase SDK 解析完成！請點擊「生成圖表」按鈕查看結果')
        }
        
      } else {
        throw new Error(`Firebase SDK 下載失敗: ${downloadResult.error}`)
      }
    } else {
      throw new Error('推論完成但未返回輸出檔案資訊')
    }

  } catch (err: unknown) {
    console.error('❌ Firebase SDK 推論流程失敗:', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    showUploadStatus('error', `Firebase SDK 處理失敗: ${errorMessage}`)
  } finally {
    isProcessing.value = false
  }
}

// 載入並初始化原有的 JavaScript 邏輯
const loadOriginalScripts = async () => {
  try {
    // 載入 vis-network
    if (!(window as any).vis) {
      await loadScript('https://unpkg.com/vis-network/standalone/umd/vis-network.min.js')
    }
    
    // 載入 Chart.js
    if (!(window as any).Chart) {
      await loadScript('https://cdn.jsdelivr.net/npm/chart.js')
      await loadScript('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@latest')
    }
    
    // 載入您的原有模組（需要將這些文件放到 public 資料夾）
    // 避免重複載入導致 "Identifier ... has already been declared"
    if (!(window as any).BubbleChartManager) {
      await loadScript('/js/bubbleChart.js')
    } else {
      console.log('↩️ BubbleChartManager 已存在，略過載入')
    }
    if (!(window as any).processReviewerData) {
      await loadScript('/js/graph_func.js')
    } else {
      console.log('↩️ processReviewerData 已存在，略過載入')
    }
    if (!(window as any).generateAllGraph) {
      await loadScript('/js/graph_3labelFunc.js')
    } else {
      console.log('↩️ generateAllGraph 已存在，略過載入')
    }
    if (!(window as any).updateGraphMode) {
      await loadScript('/js/main_graph.js')
    } else {
      console.log('↩️ updateGraphMode 已存在，略過載入')
    }
    
    // 再次確保所有函數都已載入
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 診斷函數是否正確載入
    console.log('🔍 檢查函數載入狀態:')
    console.log('- BubbleChartManager:', typeof (window as any).BubbleChartManager)
    console.log('- processReviewerData:', typeof (window as any).processReviewerData)
    console.log('- generateAllGraph:', typeof (window as any).generateAllGraph)
    console.log('- updateGraphMode:', typeof (window as any).updateGraphMode)
    console.log('- updateNetworkInstance:', typeof (window as any).updateNetworkInstance)
    
    // 獲取原有函數的引用
    originalFunctions = {
      generateAllGraph: (window as any).generateAllGraph,
      generateRelevanceGraph: (window as any).generateRelevanceGraph,
      generateConcretenessGraph: (window as any).generateConcretenessGraph,
      generateConstructiveGraph: (window as any).generateConstructiveGraph,
      BubbleChartManager: (window as any).BubbleChartManager,
      updateGraphMode: (window as any).updateGraphMode
    }
    
    console.log('✅ 原有腳本載入完成')
    return true
  } catch (error) {
    console.error('❌ 腳本載入失敗:', error)
    return false
  }
}

// 動態載入腳本的輔助函數（避免重複載入造成 "Identifier has already been declared"）
const loadScript = (src: string, isModule = false) => {
  return new Promise<void>((resolve, reject) => {
    // 若已存在相同路徑的 script，直接當作已載入完成（忽略查詢參數）
    const existed = Array.from(document.getElementsByTagName('script')).find(s => {
      try {
        if (!s.src) return false;
        const u = new URL(s.src, window.location.origin);
        return u.pathname === src;
      } catch {
        return false;
      }
    });
    if (existed) {
      console.log(`↩️ 已存在腳本：${src}，略過重複載入`);
      return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    if (isModule) script.type = 'module';
    script.dataset.injectedBy = 'ReviewEngagementGraph';
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

// 載入數據
const loadData = async () => {
  try {
    // 若沒有提供 dataUrl 或使用預設 placeholder，先嘗試載入 /js/respone.json，再回退到 /sample-review-data.json
    if (!props.dataUrl || props.dataUrl === '/api/function/3labeled_processed_totalData.json') {
      console.log('ℹ️ props.dataUrl 為預設，先嘗試載入 /js/respone.json，再回退到 /sample-review-data.json')

      // 1) 嘗試載入 /js/respone.json（大型回應）
      try {
        const resp = await fetch('/js/respone.json')
        if (resp.ok) {
          const bigData = await resp.json()
          let finalData = bigData
          const normalized = normalizeBackendData(bigData)
          if (normalized) finalData = normalized

          rawData.value = finalData
          availableHW.value = Object.keys(finalData).sort()
          selectedHW.value = [...availableHW.value]
          console.log('📋 從 /js/respone.json 中發現的作業:', availableHW.value)
          return true
        } else {
          console.warn('⚠️ 無法載入 /js/respone.json，HTTP status:', resp.status)
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        console.warn('⚠️ 嘗試載入 /js/respone.json 失敗:', errorMessage)
      }

      // 2) 回退到 /sample-review-data.json
      try {
        const sampleResp = await fetch('/sample-review-data.json')
        if (sampleResp.ok) {
          const sampleData = await sampleResp.json()
          let finalData = sampleData
          const normalized = normalizeBackendData(sampleData)
          if (normalized) finalData = normalized

          rawData.value = finalData
          availableHW.value = Object.keys(finalData).sort()
          selectedHW.value = [...availableHW.value]
          console.log('📋 從 sample-review-data.json 中發現的作業:', availableHW.value)
          return true
        } else {
          console.warn('⚠️ 無法載入 /sample-review-data.json，HTTP status:', sampleResp.status)
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        console.warn('⚠️ 嘗試載入 /sample-review-data.json 失敗:', errorMessage)
      }
    }
    
    // 若 props.dataUrl 有有效值（非預設），嘗試從該 URL 載入
    if (props.dataUrl && props.dataUrl !== '/api/function/3labeled_processed_totalData.json') {
      const response = await fetch(props.dataUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // 正規化為舊格式
      let finalData = data
      const normalized = normalizeBackendData(data)
      if (normalized) {
        finalData = normalized
      }

      rawData.value = finalData
      // 動態獲取作業列表
      availableHW.value = Object.keys(finalData).sort()
      selectedHW.value = [...availableHW.value] // 預設全選
      console.log('📋 從 dataUrl 載入的作業:', availableHW.value)
      return true
    }
    
    // 若沒有有效 dataUrl 且 sample 載入失敗，直接返回 true（等待使用者上傳）
    console.log('⏭️ 未載入任何自動資料，等待使用者上傳檔案')
    return true
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn('⚠️ 自動數據載入失敗，等待使用者上傳檔案:', errorMessage)
    return true // 即使載入失敗也返回 true，讓組件繼續運行
  }
}

// 初始化圖表
const initializeGraphs = async () => {
  if (!originalFunctions.BubbleChartManager) {
    console.warn('⚠️ 函數尚未載入，無法初始化圖表')
    return
  }
  
  try {
    // 如果有數據，初始化圖表
    if (rawData.value) {
      // 初始化 Bubble Chart
      bubbleChartManager.value = new originalFunctions.BubbleChartManager('bubbleChart')
      
      // 初始化網路圖
      await nextTick() // 確保 DOM 已更新
      updateGraphMode('all')
      
      console.log('✅ 圖表初始化完成（含數據）')
    } else {
      console.log('ℹ️ 圖表組件準備就緒，等待數據上傳')
    }
    
    isInitialized.value = true
  } catch (error) {
    console.error('❌ 圖表初始化失敗:', error)
  }
}

// 圖表模式切換（調用原有邏輯）
const updateGraphMode = (mode: string) => {
  if (!rawData.value) {
    console.log(`ℹ️ 切換到 ${mode} 模式，但尚無數據可顯示`)
    currentMode.value = mode
    return
  }
  
  if (!isInitialized.value) {
    console.warn('⚠️ 圖表尚未初始化')
    return
  }
  
  currentMode.value = mode
  const hwNames = selectedHW.value
  
  console.log(`🔄 切換到 ${mode} 模式，作業: ${hwNames.join(',')}`)
  
  try {
    // 使用 originalFunctions.updateGraphMode 統一處理
    if (originalFunctions.updateGraphMode) {
      originalFunctions.updateGraphMode(mode, hwNames, rawData.value)
    } else {
      // 備用方案：直接調用個別函數
      switch(mode) {
        case 'all':
          originalFunctions.generateAllGraph(rawData.value, hwNames)
          break
        case 'relevance':
          originalFunctions.generateRelevanceGraph(rawData.value, hwNames)
          break
        case 'concreteness':
          originalFunctions.generateConcretenessGraph(rawData.value, hwNames)
          break
        case 'constructive':
          originalFunctions.generateConstructiveGraph(rawData.value, hwNames)
          break
      }
    }
    
    // 更新氣泡圖
    updateBubbleChart(hwNames)
  } catch (error) {
    console.error('❌ 模式切換失敗:', error)
  }
}

// 更新氣泡圖
const updateBubbleChart = (hwNames: string[]) => {
  if (!bubbleChartManager.value || !rawData.value) {
    console.log('⏭️ 跳過氣泡圖更新：管理器或數據不存在')
    return
  }
  
  try {
    console.log('🔄 開始更新氣泡圖...')
    
    // 過濾數據只包含選定的作業
    const filteredData: any = {}
    hwNames.forEach((assignment: string) => {
      if ((rawData.value as any)[assignment]) {
        filteredData[assignment] = (rawData.value as any)[assignment]
      }
    })

    // 檢查過濾後的數據是否有效
    if (Object.keys(filteredData).length === 0) {
      console.warn('⚠️ 過濾後的數據為空，跳過氣泡圖更新')
      return
    }

    // 使用 init 方法重新初始化氣泡圖
    bubbleChartManager.value.init(filteredData, currentMode.value)
    
    console.log('✅ 氣泡圖更新完成')
  } catch (error) {
    console.error('❌ 氣泡圖更新失敗:', error)
    // 不再拋出錯誤，避免中斷整個流程
    showUploadStatus('warning', '氣泡圖更新失敗，請重新載入頁面後再試')
  }
}

// 應用選擇
const applySelection = () => {
  if (selectedHW.value.length === 0) {
    alert('請至少選擇一個作業！')
    return
  }
  updateGraphMode(currentMode.value)
}

// 匯出功能
const exportBubbleChart = (type: string) => {
  const canvas = document.getElementById('bubbleChart') as HTMLCanvasElement
  if (!canvas) {
    alert('找不到氣泡圖，請先載入圖表')
    return
  }
  
  const scale = type === 'high-res' ? 2 : 1
  const filename = type === 'high-res' ? '全班氣泡圖_高解析度.png' : '全班氣泡圖.png'
  
  // 創建匯出 canvas
  const exportCanvas = document.createElement('canvas')
  const exportCtx = exportCanvas.getContext('2d')
  if (!exportCtx) {
    alert('無法取得畫布上下文')
    return
  }
  
  const originalWidth = canvas.width
  const originalHeight = canvas.height
  exportCanvas.width = originalWidth * scale
  exportCanvas.height = originalHeight * scale
  
  // 設定白色背景
  exportCtx.fillStyle = 'white'
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
  
  // 縮放並繪製原始 canvas
  exportCtx.scale(scale, scale)
  exportCtx.drawImage(canvas, 0, 0)
  
  // 下載圖片
  exportCanvas.toBlob(function(blob) {
    if (!blob) {
      alert('圖片生成失敗')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

// 生命週期
onMounted(async () => {
  console.log('🚀 組件載入中...')
  
  // 載入腳本
  const scriptsLoaded = await loadOriginalScripts()
  if (!scriptsLoaded) {
    console.error('❌ 腳本載入失敗，無法繼續')
    return
  }
  
  // 載入數據
  const dataLoaded = await loadData()
  if (!dataLoaded) {
    console.error('❌ 數據載入失敗，無法繼續')
    return
  }
  
  // 初始化圖表
  await initializeGraphs()
})

onBeforeUnmount(() => {
  // 清理資源
  if (bubbleChartManager.value && bubbleChartManager.value.destroy) {
    bubbleChartManager.value.destroy()
  }
})
</script>

<style scoped>
/* 保持原有樣式，並新增以下樣式 */

/* 上傳檔案到後端按鈕區域 */
.upload-to-backend-section {
  margin-top: 20px;
  text-align: center;
}

.upload-to-backend-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto;
}

.upload-to-backend-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.upload-to-backend-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.upload-to-backend-btn svg {
  flex-shrink: 0;
}

/* 上傳中狀態 */
.uploading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 20px;
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.uploading-indicator p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

/* 後端上傳成功訊息 */
.backend-upload-success {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1px solid #10b981;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.backend-upload-success .success-icon {
  background: #10b981;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.upload-result-content {
  flex: 1;
}

.upload-result-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 12px 0;
}

.upload-result-details {
  font-size: 0.95rem;
  color: #047857;
}

.upload-result-details p {
  margin: 6px 0;
  word-break: break-all;
}

.upload-result-details strong {
  font-weight: 600;
}

.upload-link {
  color: #0d9488;
  text-decoration: none;
  font-weight: 500;
  margin-left: 8px;
}

.upload-link:hover {
  text-decoration: underline;
}

/* 其餘樣式保持不變... */
.review-engagement-graph {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin: 20px 0;
  font-size: 2.5rem;
  font-weight: 600;
}

/* 檔案上傳區域樣式 */
.upload-file-section {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.upload-section-container {
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 2px solid #f0f0f0;
}

.upload-section-title {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
}

.upload-area-wrapper {
  position: relative;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  position: relative;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #9ca3af;
  background: #f5f5f5;
  transform: translateY(-2px);
}

.upload-area.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.02);
}

.upload-area.has-file {
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-area.upload-success {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  color: #6b7280;
  opacity: 0.7;
}

.upload-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.upload-hint {
  font-size: 1.1rem;
  color: #9ca3af;
  margin: 0;
}

.uploaded-file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.file-success-icon {
  color: #10b981;
  margin-bottom: 8px;
}

.file-name {
  font-size: 1.4rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  word-break: break-all;
}

.file-size {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.remove-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.upload-success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 20px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 8px;
  font-weight: 500;
}

.success-icon {
  background: #10b981;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.upload-error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 20px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  font-weight: 500;
}

.error-icon {
  background: #ef4444;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* 進行資料處理區域樣式 */
.processing-section {
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
  text-align: center;
}

.process-btn {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  color: white;
  border: none;
  padding: 20px 60px;
  font-size: 1.4rem;
  font-weight: 600;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.process-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.process-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.processing-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.processing-indicator p {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.switch-bar {
  display: flex;
  justify-content: center;
  gap: 4px;
  background: #f8f9fa;
  border-radius: 16px;
  padding: 4px 16px;
  margin: 20px auto;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.switch-btn {
  border: none;
  background: transparent;
  color: #4682b4;
  font-size: 1.15rem;
  padding: 12px 32px;
  margin: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  font-weight: 500;
}

.switch-btn.active {
  background: #7fc6ee;
  color: #fff;
  font-weight: 600;
}

.switch-btn:not(.active):hover {
  background: #e6f3ff;
  color: #4682b4;
}

#review-graph-container {
  position: relative;
  width: 100vw;
  height: 70vh;
  margin: 20px 0;
}

.floating-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.assignment-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

#hw-select {
  width: 120px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

#hw-apply-btn {
  background: #4682b4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  width: 100%;
}

#hw-apply-btn:hover {
  background: #5a9bd4;
}

#review-graph {
  width: 100%;
  height: 100%;
}

.bubble-chart-section {
  margin: 40px auto;
  max-width: 1200px;
  padding: 0 20px;
}

.bubble-chart-section h2 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.bubble-description {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.note {
  color: #666;
}

.sub-note {
  color: #999;
}

.export-controls {
  text-align: center;
  margin: 20px 0;
}

.export-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 0 10px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
}

.export-btn:hover {
  background: #218838;
}

.bubble-chart-container {
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

#bubbleChart {
  width: 100%;
  height: 100%;
}
</style>
