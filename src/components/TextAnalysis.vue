<!-- src/components/TextAnalysis.vue -->
<template>      <!-- 檔案拖放區域 -->
      <div
        @click="fileInput?.click()"
        @drop.prevent="handleFileDrop"
        @dragleave.prevent="isDragOver = false"iv class="max-w-6xl mx-auto p-6 space-y-6">
    <!-- 標題區域 -->
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">
        📊 AI 文本分析系統
      </h1>
      <p class="text-lg text-gray-600">
        多標籤情感分析 - 相關性、具體性、建設性三維度評估
      </p>
    </div>

    <!-- API 連接狀態 -->
    <div class="bg-white rounded-lg shadow-sm border p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">🔧 API 連接設定</h3>
        <div class="flex items-center space-x-2">
          <div
            :class="[
              'w-3 h-3 rounded-full',
              apiConnected ? 'bg-green-500' : 'bg-red-500'
            ]"
          />
          <span class="text-sm font-medium">
            {{ apiConnected ? '已連接' : '未連接' }}
          </span>
        </div>
      </div>
      
      <div class="flex items-center space-x-3">
        <input
          v-model="apiUrl"
          type="url"
          placeholder="http://127.0.0.1:8000"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          @click="testConnection"
          :disabled="analyzing"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          測試連接
        </button>
      </div>
    </div>

    <!-- 檔案上傳區域 -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">📁 檔案上傳</h3>
      
      <!-- 檔案拖放區域 -->
      <div
        @click="fileInput?.click()"
        @drop.prevent="handleFileDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        :class="[
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        ]"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          @change="handleFileChange"
          class="hidden"
        />
        
        <div v-if="!selectedFile" class="text-gray-500">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-lg font-medium">點擊或拖拽 JSON 檔案到此處</p>
          <p class="text-sm text-gray-400 mt-1">支援作業評論資料格式</p>
        </div>
        
        <div v-else class="text-green-600">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium">📄 {{ selectedFile.name }}</p>
          <p class="text-sm text-gray-500 mt-1">
            {{ (selectedFile.size / 1024).toFixed(1) }} KB
          </p>
          <button
            @click.stop="clearResults"
            class="mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            清除檔案
          </button>
        </div>
      </div>

      <!-- 分析設定 -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            相關性閾值
          </label>
          <input
            :value="thresholds.relevance"
            @input="(e) => updateThreshold('relevance', Number((e.target as HTMLInputElement).value))"
            type="number"
            min="0"
            max="1"
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            具體性閾值
          </label>
          <input
            :value="thresholds.concreteness"
            @input="(e) => updateThreshold('concreteness', Number((e.target as HTMLInputElement).value))"
            type="number"
            min="0"
            max="1"
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            建設性閾值
          </label>
          <input
            :value="thresholds.constructive"
            @input="(e) => updateThreshold('constructive', Number((e.target as HTMLInputElement).value))"
            type="number"
            min="0"
            max="1"
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- 分析按鈕 -->
      <div class="mt-6">
        <button
          @click="performAnalysis"
          :disabled="!selectedFile || !apiConnected || analyzing"
          class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span v-if="analyzing" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            分析中...
          </span>
          <span v-else>🚀 開始分析</span>
        </button>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="analysisError" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800">{{ analysisError }}</p>
        </div>
      </div>
    </div>

    <!-- 分析結果 -->
    <div v-if="analysisResults" class="space-y-6">
      <!-- 成功訊息 -->
      <div class="bg-green-50 border border-green-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-800">
              ✅ 分析完成！共處理 <strong>{{ totalTexts }}</strong> 筆評論資料
            </p>
          </div>
        </div>
      </div>

      <!-- 統計卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-blue-600">{{ totalTexts }}</div>
          <div class="text-sm text-gray-500 mt-1">總分析數量</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-green-600">{{ statisticsData.relevance }}</div>
          <div class="text-sm text-gray-500 mt-1">相關性正面</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-yellow-600">{{ statisticsData.concreteness }}</div>
          <div class="text-sm text-gray-500 mt-1">具體性正面</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-purple-600">{{ statisticsData.constructive }}</div>
          <div class="text-sm text-gray-500 mt-1">建設性正面</div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 標籤分佈統計</h3>
          <canvas ref="barChart" class="max-h-80"></canvas>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📈 信心度趨勢</h3>
          <canvas ref="lineChart" class="max-h-80"></canvas>
        </div>
      </div>

      <!-- 導出功能 -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">💾 導出結果</h3>
        <div class="flex flex-wrap gap-3">
          <button
            @click="exportResultsAsCSV"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            📊 導出 CSV
          </button>
          <button
            @click="exportResultsAsJSON"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            📋 導出 JSON
          </button>
        </div>
      </div>

      <!-- 詳細結果表格 -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">📋 詳細分析結果</h3>
          <span class="text-sm text-gray-500">顯示前 20 筆</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作業/作業ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  回饋內容
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  相關性
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  具體性
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建設性
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(item, index) in allResults.slice(0, 20)" :key="index" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900">
                  <div class="font-medium">{{ item.homework || 'N/A' }}</div>
                  <div v-if="item.assignment_id" class="text-xs text-gray-500">ID: {{ item.assignment_id }}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div class="truncate" :title="item.text">
                    {{ item.text.length > 80 ? item.text.substring(0, 80) + '...' : item.text }}
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex flex-col items-center space-y-1">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        item.predictions.relevance
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ item.predictions.relevance ? '✓' : '✗' }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ (item.predictions.relevance_confidence * 100).toFixed(1) }}%
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex flex-col items-center space-y-1">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        item.predictions.concreteness
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ item.predictions.concreteness ? '✓' : '✗' }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ (item.predictions.concreteness_confidence * 100).toFixed(1) }}%
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex flex-col items-center space-y-1">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        item.predictions.constructive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ item.predictions.constructive ? '✓' : '✗' }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ (item.predictions.constructive_confidence * 100).toFixed(1) }}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useTextAnalysis } from '@/composables/useTextAnalysis'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const {
  selectedFile,
  analyzing,
  analysisResults,
  analysisError,
  apiConnected,
  apiUrl,
  thresholds,
  totalTexts,
  allResults,
  statisticsData,
  chartData,
  confidenceChartData,
  testConnection,
  handleFileSelect,
  performAnalysis,
  exportResultsAsCSV,
  exportResultsAsJSON,
  clearResults,
  updateThreshold,
  init
} = useTextAnalysis()

const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()
const barChart = ref<HTMLCanvasElement>()
const lineChart = ref<HTMLCanvasElement>()

let barChartInstance: Chart | null = null
let lineChartInstance: Chart | null = null

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  await handleFileSelect(file)
}

const handleFileDrop = async (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0] || null
  await handleFileSelect(file)
}

const createCharts = () => {
  nextTick(() => {
    // 銷毀現有圖表
    if (barChartInstance) {
      barChartInstance.destroy()
    }
    if (lineChartInstance) {
      lineChartInstance.destroy()
    }

    // 創建柱狀圖
    if (barChart.value) {
      barChartInstance = new Chart(barChart.value, {
        type: 'bar',
        data: chartData.value,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '多標籤分析結果分佈'
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: Math.max(totalTexts.value, 10)
            }
          }
        }
      })
    }

    // 創建折線圖
    if (lineChart.value && confidenceChartData.value.datasets[0].data.length > 0) {
      lineChartInstance = new Chart(lineChart.value, {
        type: 'line',
        data: confidenceChartData.value,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '信心度變化趨勢'
            }
          },
          scales: {
            y: {
              min: 0,
              max: 1,
              ticks: {
                callback: (value) => `${(Number(value) * 100).toFixed(0)}%`
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      })
    }
  })
}

// 監聽分析結果變化，自動創建圖表
watch(analysisResults, (newResults) => {
  if (newResults) {
    createCharts()
  }
}, { immediate: false })

onMounted(async () => {
  await init()
})
</script>
