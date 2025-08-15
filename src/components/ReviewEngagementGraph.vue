<template>
  <div class="review-engagement-graph">
    <h1>Review Engagement Graph</h1>
    
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
        <button @click="applySelection" id="hw-apply-btn">GO</button>
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

<script>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

export default {
  name: 'ReviewEngagementGraph',
  props: {
    dataUrl: {
      type: String,
      default: '/api/function/3labeled_processed_totalData.json'
    }
  },
  setup(props) {
    // Vue 響應式數據
    const currentMode = ref('all')
    const selectedHW = ref([])
    const availableHW = ref([])
    const rawData = ref(null)
    const bubbleChartManager = ref(null)
    const isInitialized = ref(false)
    
    const modes = [
      { value: 'all', label: 'All' },
      { value: 'relevance', label: 'Relevance' },
      { value: 'concreteness', label: 'Concreteness' },
      { value: 'constructive', label: 'Constructive' }
    ]

    // 導入原有的 JavaScript 模組（這些會在後面設置）
    let originalFunctions = {}

    // 載入並初始化原有的 JavaScript 邏輯
    const loadOriginalScripts = async () => {
      try {
        // 載入 vis-network
        if (!window.vis) {
          await loadScript('https://unpkg.com/vis-network/standalone/umd/vis-network.min.js')
        }
        
        // 載入 Chart.js
        if (!window.Chart) {
          await loadScript('https://cdn.jsdelivr.net/npm/chart.js')
          await loadScript('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@latest')
        }
        
        // 載入您的原有模組（需要將這些文件放到 public 資料夾）
        await loadScript('/js/bubbleChart.js')
        await loadScript('/js/graph_func.js')
        await loadScript('/js/graph_3labelFunc.js')
        await loadScript('/js/main_graph.js')
        
        // 獲取原有函數的引用
        originalFunctions = {
          generateAllGraph: window.generateAllGraph,
          generateRelevanceGraph: window.generateRelevanceGraph,
          generateConcretenessGraph: window.generateConcretenessGraph,
          generateConstructiveGraph: window.generateConstructiveGraph,
          BubbleChartManager: window.BubbleChartManager
        }
        
        console.log('✅ 原有腳本載入完成')
        return true
      } catch (error) {
        console.error('❌ 腳本載入失敗:', error)
        return false
      }
    }

    // 動態載入腳本的輔助函數
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    // 載入數據
    const loadData = async () => {
      try {
        const response = await fetch(props.dataUrl)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        rawData.value = data
        
        // 動態獲取作業列表
        availableHW.value = Object.keys(data).sort()
        selectedHW.value = [...availableHW.value] // 預設全選
        
        console.log('📋 從JSON檔案中發現的作業:', availableHW.value)
        return true
      } catch (error) {
        console.error('❌ 載入數據失敗:', error)
        return false
      }
    }

    // 初始化圖表
    const initializeGraphs = async () => {
      if (!rawData.value || !originalFunctions.BubbleChartManager) {
        console.warn('⚠️ 數據或函數尚未載入')
        return
      }
      
      try {
        // 初始化 Bubble Chart
        bubbleChartManager.value = new originalFunctions.BubbleChartManager()
        
        // 初始化網路圖
        await nextTick() // 確保 DOM 已更新
        updateGraphMode('all')
        
        isInitialized.value = true
        console.log('✅ 圖表初始化完成')
      } catch (error) {
        console.error('❌ 圖表初始化失敗:', error)
      }
    }

    // 圖表模式切換（調用原有邏輯）
    const updateGraphMode = (mode) => {
      if (!rawData.value || !isInitialized.value) {
        console.warn('⚠️ 圖表尚未初始化')
        return
      }
      
      currentMode.value = mode
      const hwNames = selectedHW.value
      
      console.log(`🔄 切換到 ${mode} 模式，作業: ${hwNames.join(',')}`)
      
      try {
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
        
        // 更新氣泡圖
        updateBubbleChart(hwNames)
      } catch (error) {
        console.error('❌ 模式切換失敗:', error)
      }
    }

    // 更新氣泡圖
    const updateBubbleChart = (hwNames) => {
      if (!bubbleChartManager.value || !rawData.value) return
      
      try {
        // 準備氣泡圖數據（這裡需要複製原有的數據準備邏輯）
        const networkData = prepareNetworkDataForBubbleChart(hwNames)
        if (networkData) {
          bubbleChartManager.value.updateData(networkData)
        }
      } catch (error) {
        console.error('❌ 氣泡圖更新失敗:', error)
      }
    }

    // 準備氣泡圖數據（從原有代碼複製）
    const prepareNetworkDataForBubbleChart = (hwNames) => {
      if (!rawData.value) return null
      
      const studentData = new Map()
      
      hwNames.forEach(hwName => {
        const hwData = rawData.value[hwName] || []
        
        hwData.forEach(assignment => {
          const reviewerName = assignment.Reviewer_Name
          if (!reviewerName) return
          
          if (!studentData.has(reviewerName)) {
            studentData.set(reviewerName, {
              id: reviewerName,
              reviewCount: 0,
              totalReviews: 0,
              relevanceCount: 0,
              concretenessCount: 0,
              constructiveCount: 0,
              assignments: new Set()
            })
          }
          
          const student = studentData.get(reviewerName)
          student.assignments.add(hwName)
          
          if (assignment.Round && assignment.Round.length > 0) {
            assignment.Round.forEach(round => {
              student.totalReviews++
              if (round.Relevance === 1) student.relevanceCount++
              if (round.Concreteness === 1) student.concretenessCount++
              if (round.Constructive === 1) student.constructiveCount++
            })
          }
        })
      })
      
      return Array.from(studentData.values())
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
    const exportBubbleChart = (type) => {
      const canvas = document.getElementById('bubbleChart')
      if (!canvas) {
        alert('找不到氣泡圖，請先載入圖表')
        return
      }
      
      const scale = type === 'high-res' ? 2 : 1
      const filename = type === 'high-res' ? '全班氣泡圖_高解析度.png' : '全班氣泡圖.png'
      
      // 創建匯出 canvas
      const exportCanvas = document.createElement('canvas')
      const exportCtx = exportCanvas.getContext('2d')
      
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

    return {
      currentMode,
      selectedHW,
      availableHW,
      modes,
      updateGraphMode,
      applySelection,
      exportBubbleChart,
      isInitialized
    }
  }
}
</script>

<style scoped>
/* 複製您原有的 CSS 樣式 */
.review-engagement-graph {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin: 20px 0;
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
