<template>
  <div class="review-engagement-graph">
    <h1>Review Engagement Graph</h1>

    <!-- 上傳檔案區域 -->
    <div class="upload-file-section">
      <div class="upload-section-container">
        <h3 class="upload-section-title">上傳檔案區</h3>

        <div class="upload-area-wrapper">
          <div
            class="upload-area"
            :class="{
              'drag-over': isDragOver,
              'has-file': uploadedFile,
              'upload-success':
                uploadedFile && uploadStatus?.type === 'success',
            }"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleFileDrop"
            @click="triggerFileInput"
          >
            <!-- 檔案輸入 -->
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileSelect"
              style="display: none"
            />

            <!-- 上傳區域顯示 -->
            <div v-if="!uploadedFile" class="upload-placeholder">
              <div class="upload-icon">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    d="M7 18a4.6 4.4 0 0 1 0-9 5 5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7H7z"
                  />
                  <path d="m9 15 3-3 3 3" />
                  <path d="M12 12v9" />
                </svg>
              </div>
              <p class="upload-text">點擊或拖曳檔案到此處</p>
              <p class="upload-hint">支援 JSON 格式檔案</p>
            </div>

            <!-- 已上傳檔案顯示 -->
            <div v-else class="uploaded-file-info">
              <div class="file-success-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M9 11l3 3 8-8" />
                  <path
                    d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.306 0 2.54.279 3.66.775"
                  />
                </svg>
              </div>
              <p class="file-name">{{ uploadedFile.name }}</p>
              <p class="file-size">{{ formatFileSize(uploadedFile.size) }}</p>
              <button @click.stop="removeFile" class="remove-btn">
                重新選擇檔案
              </button>
            </div>
          </div>

          <!-- 錯誤狀態 -->
          <div
            v-if="uploadStatus?.type === 'error'"
            class="upload-error-message"
          >
            <div class="error-icon">✗</div>
            <span>{{ uploadStatus.message }}</span>
          </div>

          <!-- 上傳檔案到後端按鈕 -->
          <div
            v-if="uploadedFile && !isUploading"
            class="upload-to-backend-section"
          >
            <button
              @click="uploadFileToBackend"
              class="upload-to-backend-btn"
              :disabled="!uploadedFile || isUploading"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
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
              <p class="upload-result-title">
                檔案已成功上傳到 Firebase Storage！
              </p>
              <div class="upload-result-details">
                <p>
                  <strong>檔案路徑:</strong>
                  {{ backendUploadResult.data?.name }}
                </p>
                <p v-if="backendUploadResult.data?.public_url">
                  <strong>公開連結:</strong>
                  <a
                    :href="backendUploadResult.data.public_url"
                    target="_blank"
                    class="upload-link"
                  >
                    查看檔案
                  </a>
                </p>
                <p v-else-if="backendUploadResult.data?.gs_uri">
                  <strong>Storage URI:</strong>
                  {{ backendUploadResult.data.gs_uri }}
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
        :disabled="!uploadedFile || !backendUploadResult"
      >
        🔮 推論分析並生成圖表
      </button>

      <!-- 處理中狀態 -->
      <div v-if="isProcessing" class="processing-indicator">
        <div class="spinner"></div>
        <p v-if="taskStatus === 'PENDING'">建立推論任務中...</p>
        <p v-else-if="taskStatus === 'PROCESSING'">
          🤖 AI 模型分析中，請耐心等待...
        </p>
        <p v-else>處理中...</p>
      </div>
    </div>

    <!-- 更新任務狀態顯示區域 -->
    <div v-if="currentTaskId" class="task-status-section">
      <div class="task-info">
        <h4>📋 推論任務狀態</h4>
        <div class="task-details">
          <p><strong>任務 ID:</strong> {{ currentTaskId.slice(0, 8) }}...</p>
          <p>
            <strong>狀態:</strong>
            <span :class="'status-' + taskStatus.toLowerCase()">
              {{ getStatusText(taskStatus) }}
            </span>
          </p>

          <!-- 新增進度條和進度資訊 -->
          <div
            v-if="taskProgress !== null && taskStatus === 'RUNNING'"
            class="progress-section"
          >
            <div class="progress-info">
              <span class="progress-label">處理進度:</span>
              <span class="progress-percentage">{{ taskProgress }}%</span>
            </div>
            <div class="progress-bar-container">
              <div
                class="progress-bar"
                :style="{ width: taskProgress + '%' }"
              ></div>
            </div>
          </div>

          <!-- 進度訊息 -->
          <p v-if="taskProgressMessage" class="progress-message">
            <strong>🔄 進度訊息:</strong> {{ taskProgressMessage }}
          </p>

          <!-- 推論訊息 -->
          <p
            v-if="inferenceMessage && inferenceMessage !== taskProgressMessage"
          >
            <strong>📄 任務訊息:</strong> {{ inferenceMessage }}
          </p>

          <!-- 新增時間資訊 -->
          <div v-if="taskTimestamps.created_at" class="timestamp-section">
            <p class="timestamp-item">
              <strong>🕐 建立時間:</strong>
              {{ formatTimestamp(taskTimestamps.created_at) }}
            </p>
            <p v-if="taskTimestamps.started_at" class="timestamp-item">
              <strong>🚀 開始時間:</strong>
              {{ formatTimestamp(taskTimestamps.started_at) }}
            </p>
            <p v-if="taskTimestamps.updated_at" class="timestamp-item">
              <strong>🔄 更新時間:</strong>
              {{ formatTimestamp(taskTimestamps.updated_at) }}
            </p>
          </div>
        </div>
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
        <select id="hw-select" v-model="selectedHW" multiple size="5">
          <option v-for="hw in availableHW" :key="hw" :value="hw">
            {{ hw }}
          </option>
        </select>
      </div>
      <div id="review-graph"></div>
    </div>

    <!-- 氣泡圖區塊 -->
    <div class="bubble-chart-section">
      <h2>🫧 全班作業審查狀況多維氣泡圖</h2>
      <p class="bubble-description">
        X軸為品質指標（相關性、具體性、建設性、總和），Y軸為學生<br />
        氣泡大小為審查參與度（完成Assignment數/分配Assignment數），顏色深淺為該標籤比例<br />
        <small class="note"
          >※ 單一標籤比例可能超過100%，因為一個評論可能同時有多個標籤</small
        ><br />
        <small class="sub-note"
          >※
          網路圖節點大小也使用相同的審查參與度計算，方便比較學生作業完成狀況</small
        >
      </p>

      <div class="export-controls">
        <button @click="exportBubbleChart('normal')" class="export-btn">
          💾 匯出氣泡圖為 PNG
        </button>
        <button @click="exportBubbleChart('high-res')" class="export-btn">
          📸 匯出高解析度 PNG
        </button>
      </div>

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
import { getFirestore, doc, onSnapshot, type Unsubscribe } from 'firebase/firestore'

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
const bubbleChartManager = ref<any>(null) // 氣泡圖管理器
const isInitialized = ref(false)

// 檔案上傳相關響應式數據
const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const isDragOver = ref(false)
const uploadStatus = ref<{type: string, message: string} | null>(null)
const isProcessing = ref(false)
const isUploading = ref(false)
const backendUploadResult = ref<any>(null)

// 新的推論任務相關狀態
const currentTaskId = ref<string | null>(null)
const taskStatus = ref<string>('idle')
const inferenceMessage = ref<string>('')
const taskProgress = ref<number | null>(null)
const taskProgressMessage = ref<string>('')
const taskTimestamps = ref<{
  created_at?: string
  started_at?: string
  updated_at?: string
  finished_at?: string
}>({})

// Firebase Firestore 監聽器
let unsubscribeSnapshot: Unsubscribe | null = null

const modes = [
  { value: 'all', label: 'All' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'concreteness', label: 'Concreteness' },
  { value: 'constructive', label: 'Constructive' }
]

// 導入原有的 JavaScript 模組（這些會在後面設置）
let originalFunctions: any = {}

// 動態載入腳本的輔助函數
const loadScript = (src: string, isModule = false): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // 檢查是否已存在相同的腳本
    const existingScript = document.querySelector(`script[src="${src}"]`)
    if (existingScript) {
      console.log(`📦 腳本已存在: ${src}`)
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    if (isModule) script.type = 'module'
    script.dataset.injectedBy = 'ReviewEngagementGraph'

    script.onload = () => {
      console.log(`✅ 腳本載入成功: ${src}`)
      resolve()
    }

    script.onerror = (error) => {
      console.error(`❌ 腳本載入失敗: ${src}`, error)
      reject(new Error(`Failed to load script: ${src}`))
    }

    document.head.appendChild(script)
  })
}

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
  resetTaskState() // 重置任務狀態
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
    // 使用 uploadFileAPI 進行上傳
    const result = await uploadAPI.uploadToFirebase(
      uploadedFile.value,
      { destination: `data/${uploadedFile.value.name}` }
    )

    if (result.success) {
      backendUploadResult.value = result
      showUploadStatus('success', '檔案已成功上傳到 Firebase Storage！')
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

    // 新增：處理推論結果格式 { processed_data: { HW1: [...] } }
    if (data.processed_data && typeof data.processed_data === 'object') {
      const converted: Record<string, any[]> = {};
      Object.keys(data.processed_data).forEach((hw) => {
        converted[hw] = extractArray(data.processed_data[hw]);
      });
      return converted;
    }

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
    console.error('❌ 數據正規化失敗:', err);
    return null;
  }
}

// Firebase Firestore 監聽器
const db = getFirestore()

// Firestore 監聽函數
const listenToTaskStatus = (taskId: string) => {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot()
  }

  const taskDoc = doc(db, 'tasks', taskId)

  unsubscribeSnapshot = onSnapshot(taskDoc, (doc) => {
    if (doc.exists()) {
      const data = doc.data()

      // 更新基本狀態
      taskStatus.value = data.status || 'PENDING'
      inferenceMessage.value = data.message || ''

      // 更新進度資訊
      taskProgress.value = data.progress !== undefined ? data.progress : null
      taskProgressMessage.value = data.progress_message || ''

      // 更新時間戳
      taskTimestamps.value = {
        created_at: data.created_at,
        started_at: data.started_at,
        updated_at: data.updated_at,
        finished_at: data.finished_at
      }

      // 根據狀態更新 UI 訊息
      if (data.status === 'COMPLETED') {
        showUploadStatus('success', '🎉 推論已完成！正在處理結果...')
        handleInferenceComplete(data)

        // 停止監聽
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot()
          unsubscribeSnapshot = null
        }
      } else if (data.status === 'FAILED' || data.status === 'ERROR') {
        console.error('❌ 推論失敗:', data.error)
        showUploadStatus('error', `推論失敗: ${data.error || '未知錯誤'}`)
        isProcessing.value = false
        taskStatus.value = 'FAILED'

        // 停止監聽
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot()
          unsubscribeSnapshot = null
        }
      } else if (data.status === 'PROCESSING' || data.status === 'RUNNING') {
        taskStatus.value = data.status

        // 更新狀態訊息，包含進度資訊
        let statusMessage = '🤖 AI 模型正在分析中，請耐心等待...'
        if (data.progress !== undefined) {
          statusMessage += ` (進度: ${data.progress}%)`
        }
        if (data.progress_message) {
          statusMessage = `🤖 ${data.progress_message}`
        }

        showUploadStatus('info', statusMessage)
      } else if (data.status === 'PENDING') {
        taskStatus.value = 'PENDING'
        showUploadStatus('info', '⏳ 任務等待處理中...')
      }
    } else {
      console.error('❌ 任務文檔不存在 - Task ID:', taskId)
      showUploadStatus('error', '任務處理失敗：找不到任務記錄')
      isProcessing.value = false
      taskStatus.value = 'FAILED'

      // 停止監聽
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
        unsubscribeSnapshot = null
      }
    }
  }, (error) => {
    console.error('❌ Firestore 監聽錯誤:', error)
    showUploadStatus('error', `監聽失敗: ${error.message}`)
    isProcessing.value = false
    taskStatus.value = 'FAILED'
  })
}

// 新增格式化時間戳的函數
const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return '未知'

  try {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    return timestamp
  }
}

// 更新狀態重置函數
const resetTaskState = () => {
  currentTaskId.value = null
  taskStatus.value = 'idle'
  inferenceMessage.value = ''
  taskProgress.value = null
  taskProgressMessage.value = ''
  taskTimestamps.value = {}
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot()
    unsubscribeSnapshot = null
  }
}

// 添加缺少的 getStatusText 函數
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    idle: '待命中',
    PENDING: '等待中',
    PROCESSING: '處理中',
    RUNNING: '執行中',
    COMPLETED: '已完成',
    FAILED: '失敗',
    ERROR: '錯誤'
  }
  return statusMap[status] || status
}

// 更新 sendJSONPayload 函數以初始化狀態
const sendJSONPayload = async () => {
  if (!uploadedFile.value) {
    showUploadStatus('error', '請先上傳或選擇 JSON 檔案')
    return
  }

  if (!backendUploadResult.value) {
    showUploadStatus('error', '請先點擊「上傳檔案到後端」按鈕')
    return
  }

  // 重置所有任務相關狀態
  resetTaskState()

  isProcessing.value = true
  taskStatus.value = 'PENDING'

  try {
    const uploadedPath = (backendUploadResult.value.data as any)?.data?.name || (backendUploadResult.value.data as any)?.name
    if (!uploadedPath) {
      throw new Error('無法取得上傳檔案的路徑')
    }

    const gsUri = `gs://minnn-project.firebasestorage.app/${uploadedPath}`

    showUploadStatus('info', '正在建立推論任務...')

    const inferResult = await textAnalysisAPI.inferenceFromStorage(gsUri)

    currentTaskId.value = inferResult.task_id
    inferenceMessage.value = inferResult.message

    showUploadStatus('info', `任務已建立，開始監聽狀態更新...`)

    // 立即開始監聽
    listenToTaskStatus(inferResult.task_id)

  } catch (error: any) {
    console.error('❌ 推論流程失敗:', error)
    showUploadStatus('error', `推論失敗: ${error.message}`)
    isProcessing.value = false
    taskStatus.value = 'FAILED'
  }
}

// 載入並初始化原有的 JavaScript 邏輯
const loadOriginalScripts = async () => {
  try {
    // 載入 vis-network
    if (!(window as any).vis) {
      await loadScript('https://unpkg.com/vis-network/standalone/umd/vis-network.min.js')
    }

    // 載入 Chart.js（氣泡圖需要）
    if (!(window as any).Chart) {
      await loadScript('https://cdn.jsdelivr.net/npm/chart.js')
      await loadScript('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@latest')
    }

    // 載入網路圖相關的 JavaScript 檔案
    if (!(window as any).processReviewerData) {
      await loadScript('/js/graph_func.js')
    }

    if (!(window as any).generateAllGraph) {
      await loadScript('/js/graph_3labelFunc.js')
    }

    if (!(window as any).updateGraphMode) {
      await loadScript('/js/main_graph.js')
    }

    // 載入氣泡圖模組
    if (!(window as any).BubbleChartManager) {
      await loadScript('/js/bubbleChart.js')
    }

    // 等待所有腳本完全載入
    await new Promise(resolve => setTimeout(resolve, 200))

    // 獲取原有函數的引用
    originalFunctions = {
      generateAllGraph: (window as any).generateAllGraph,
      generateRelevanceGraph: (window as any).generateRelevanceGraph,
      generateConcretenessGraph: (window as any).generateConcretenessGraph,
      generateConstructiveGraph: (window as any).generateConstructiveGraph,
      updateGraphMode: (window as any).updateGraphMode,
      BubbleChartManager: (window as any).BubbleChartManager
    }

    console.log('✅ 所有腳本載入完成')
    console.log('🔍 可用函數:', Object.keys(originalFunctions))

    return true
  } catch (error) {
    console.error('❌ 腳本載入失敗:', error)
    return false
  }
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
  try {
    // 如果有數據，初始化圖表
    if (rawData.value) {
      console.log('🔄 初始化圖表中...')
      
      // 等待 DOM 更新
      await nextTick()
      
      // 初始化氣泡圖（如果可用）
      if (originalFunctions.BubbleChartManager) {
        try {
          // 確保 canvas 元素存在
          const canvas = document.getElementById('bubbleChart')
          if (canvas) {
            console.log('✅ 找到 bubbleChart canvas 元素')
            
            // 創建 BubbleChartManager 時傳入 canvas ID
            bubbleChartManager.value = new originalFunctions.BubbleChartManager('bubbleChart')
            console.log('✅ 氣泡圖管理器初始化成功')
            
            // 直接使用 rawData 初始化氣泡圖
            bubbleChartManager.value.init(rawData.value, currentMode.value)
            console.log('✅ 氣泡圖數據已從 rawData 載入')
          } else {
            console.warn('⚠️ 找不到 bubbleChart canvas 元素，跳過氣泡圖初始化')
          }
        } catch (error) {
          console.warn('⚠️ 氣泡圖初始化失敗:', error)
          // 氣泡圖初始化失敗不應該阻止整個初始化過程
        }
      } else {
        console.warn('⚠️ BubbleChartManager 類別不存在，跳過氣泡圖初始化')
      }
      
      // 初始化網路圖
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
    // 使用 originalFunctions.updateGraphMode 統一處理網路圖
    if (originalFunctions.updateGraphMode) {
      originalFunctions.updateGraphMode(mode, hwNames, rawData.value)
    } else {
      // 備用方案：直接調用個別函數
      switch(mode) {
        case 'all':
          if (originalFunctions.generateAllGraph) {
            originalFunctions.generateAllGraph(rawData.value, hwNames)
          }
          break
        case 'relevance':
          if (originalFunctions.generateRelevanceGraph) {
            originalFunctions.generateRelevanceGraph(rawData.value, hwNames)
          }
          break
        case 'concreteness':
          if (originalFunctions.generateConcretenessGraph) {
            originalFunctions.generateConcretenessGraph(rawData.value, hwNames)
          }
          break
        case 'constructive':
          if (originalFunctions.generateConstructiveGraph) {
            originalFunctions.generateConstructiveGraph(rawData.value, hwNames)
          }
          break
      }
    }
    
    // 網路圖更新完成後，直接從 rawData 更新氣泡圖
    setTimeout(() => {
      if (bubbleChartManager.value && rawData.value) {
        try {
          bubbleChartManager.value.init(rawData.value, mode)
          console.log('✅ 氣泡圖已同步更新到新模式')
        } catch (error) {
          console.warn('⚠️ 氣泡圖模式切換失敗:', error)
        }
      }
    }, 500)
    
  } catch (error) {
    console.error('❌ 模式切換失敗:', error)
  }
}

// 新增：applySelection 函數，根據選擇的作業生成圖表
const applySelection = () => {
  // 重新生成圖表，使用目前的模式和選擇的作業
  updateGraphMode(currentMode.value)
}

// 處理推論完成的函數
const handleInferenceComplete = async (taskData: any) => {
  try {
    // 從 output_file 下載結果
    if (!taskData.output_file) {
      throw new Error('推論完成但沒有輸出檔案')
    }
    
    showUploadStatus('info', '正在下載推論結果...')
    
    const downloadResult = await textAnalysisAPI.downloadInferenceResult(taskData.output_file)
    
    if (!downloadResult.success) {
      throw new Error(downloadResult.error || '下載失敗')
    }
    
    const resultData = downloadResult.data
    
    // 正規化後端數據
    const normalizedData = normalizeBackendData(resultData)
    
    if (normalizedData) {
      rawData.value = normalizedData
      
      // 更新可用作業列表
      availableHW.value = Object.keys(normalizedData).sort()
      selectedHW.value = [...availableHW.value]
      
      showUploadStatus('success', '✅ 推論完成！圖表正在更新...')
      
      await nextTick()
      
      // 重新初始化圖表（包含氣泡圖）
      await initializeGraphs()
      
      showUploadStatus('success', '🎉 推論完成，圖表已更新！')
    } else {
      throw new Error('無法處理推論結果數據')
    }
    
    isProcessing.value = false
    taskStatus.value = 'COMPLETED'
    
  } catch (error: any) {
    console.error('❌ 處理推論結果失敗:', error)
    showUploadStatus('error', `處理結果失敗: ${error.message}`)
    isProcessing.value = false
    taskStatus.value = 'FAILED'
  }
}

// 匯出功能 - 增強版本
const exportBubbleChart = (type: string) => {
  try {
    const canvas = document.getElementById('bubbleChart') as HTMLCanvasElement
    if (!canvas) {
      showUploadStatus('error', '找不到氣泡圖，請先載入圖表')
      return
    }
    
    // 檢查 canvas 是否有內容
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      showUploadStatus('error', '無法取得畫布上下文')
      return
    }
    
    // 檢查 canvas 是否為空白
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const isEmpty = imageData.data.every(value => value === 0)
    
    if (isEmpty) {
      showUploadStatus('warning', '氣泡圖尚未載入完成，請稍後再試')
      return
    }
    
    const scale = type === 'high-res' ? 2 : 1
    const filename = type === 'high-res' ? '全班氣泡圖_高解析度.png' : '全班氣泡圖.png'
    
    // 創建匯出 canvas
    const exportCanvas = document.createElement('canvas')
    const exportCtx = exportCanvas.getContext('2d')
    if (!exportCtx) {
      showUploadStatus('error', '無法取得匯出畫布上下文')
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
        showUploadStatus('error', '圖片生成失敗')
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
      
      showUploadStatus('success', `氣泡圖已匯出為 ${type === 'high-res' ? '高解析度 ' : ''}PNG`)
    }, 'image/png')
    
  } catch (error: any) {
    console.error('❌ 氣泡圖匯出失敗:', error)
    showUploadStatus('error', `匯出失敗: ${error.message}`)
  }
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
  resetTaskState()
  if (bubbleChartManager.value && bubbleChartManager.value.destroy) {
    bubbleChartManager.value.destroy()
  }
})
</script>

<style>
@import '@/css/style.css';
</style>
