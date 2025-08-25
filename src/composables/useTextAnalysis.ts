// src/composables/useTextAnalysis.ts
import { ref, computed, type Ref } from 'vue'
import { textAnalysisAPI, type AnalysisResults, type AnalysisThresholds, type AnalysisItem } from '../services/textAnalysisAPI'

export function useTextAnalysis() {
  // 反應式狀態
  const selectedFile: Ref<File | null> = ref(null)
  const analyzing = ref(false)
  const analysisResults: Ref<AnalysisResults | null> = ref(null)
  const analysisError = ref('')
  const apiConnected = ref(false)
  const apiUrl = ref('http://127.0.0.1:8000')
  
  const thresholds = ref<AnalysisThresholds>({
    relevance: 0.5,
    concreteness: 0.5,
    constructive: 0.5
  })

  // 計算屬性
  const totalTexts = computed(() => {
    if (!analysisResults.value) return 0
    return analysisResults.value.total_processed
  })

  const allResults = computed((): AnalysisItem[] => {
    if (!analysisResults.value) return []
    const results: AnalysisItem[] = []
    
    const entries = Object.entries(analysisResults.value.results as Record<string, AnalysisItem[]>)
    entries.forEach(([hwName, items]) => {
      items.forEach((item: AnalysisItem) => {
        results.push({
          ...item,
          homework: hwName
        } as AnalysisItem & { homework: string })
      })
    })
    
    return results
  })

  const statisticsData = computed(() => {
    const results = allResults.value
    if (results.length === 0) {
      return {
        relevance: 0,
        concreteness: 0,
        constructive: 0,
        total: 0,
        positiveRate: 0
      }
    }

    const stats = {
      relevance: results.filter(r => r.predictions.relevance).length,
      concreteness: results.filter(r => r.predictions.concreteness).length,
      constructive: results.filter(r => r.predictions.constructive).length,
      total: results.length,
      positiveRate: 0
    }

    const totalPositive = stats.relevance + stats.concreteness + stats.constructive
    const totalPossible = stats.total * 3
    stats.positiveRate = Math.round((totalPositive / totalPossible) * 100)

    return stats
  })

  const chartData = computed(() => {
    const stats = statisticsData.value
    return {
      labels: ['相關性', '具體性', '建設性'],
      datasets: [{
        label: '正面標籤數量',
        data: [stats.relevance, stats.concreteness, stats.constructive],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(34, 197, 94, 0.8)',   // Green
          'rgba(245, 158, 11, 0.8)'   // Amber
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 2
      }]
    }
  })

  const confidenceChartData = computed(() => {
    const results = allResults.value.slice(0, 50) // 限制顯示數量避免圖表過擠
    
    return {
      labels: results.map((_, index) => `#${index + 1}`),
      datasets: [
        {
          label: '相關性信心度',
          data: results.map(r => r.predictions.relevance_confidence),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: '具體性信心度',
          data: results.map(r => r.predictions.concreteness_confidence),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4
        },
        {
          label: '建設性信心度',
          data: results.map(r => r.predictions.constructive_confidence),
          borderColor: 'rgba(245, 158, 11, 1)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4
        }
      ]
    }
  })

  // 方法
  const testConnection = async (): Promise<boolean> => {
    try {
      textAnalysisAPI.updateBaseURL(apiUrl.value)
      const result = await textAnalysisAPI.testConnection()
      
      if (result.success) {
        apiConnected.value = true
        analysisError.value = ''
        return true
      } else {
        apiConnected.value = false
        analysisError.value = result.error || '連接失敗'
        return false
      }
    } catch (error: any) {
      apiConnected.value = false
      analysisError.value = error.message
      return false
    }
  }

  const handleFileSelect = (file: File | null): boolean => {
    if (!file) {
      selectedFile.value = null
      analysisError.value = ''
      return false
    }

    if (!file.name.endsWith('.json')) {
      analysisError.value = '請選擇 JSON 格式的檔案'
      selectedFile.value = null
      return false
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB 限制
      analysisError.value = '檔案大小不能超過 10MB'
      selectedFile.value = null
      return false
    }

    selectedFile.value = file
    analysisError.value = ''
    return true
  }

  const performAnalysis = async (): Promise<boolean> => {
    if (!selectedFile.value) {
      analysisError.value = '請先選擇檔案'
      return false
    }

    if (!apiConnected.value) {
      analysisError.value = '請先測試 API 連接'
      return false
    }

    analyzing.value = true
    analysisError.value = ''
    analysisResults.value = null

    try {
      // 讀取檔案
      const jsonData = await textAnalysisAPI.readFileAsJSON(selectedFile.value)
      
      // 驗證資料格式
      if (typeof jsonData !== 'object' || jsonData === null) {
        throw new Error('無效的 JSON 格式')
      }

      // 發送分析請求
      const result = await textAnalysisAPI.analyzeJSON(jsonData, [
        thresholds.value.relevance,
        thresholds.value.concreteness,
        thresholds.value.constructive
      ])

      if (result.success && result.data) {
        analysisResults.value = result.data
        return true
      } else {
        analysisError.value = result.error || '分析失敗'
        return false
      }

    } catch (error: any) {
      analysisError.value = error.message || '處理失敗'
      return false
    } finally {
      analyzing.value = false
    }
  }

  const exportResultsAsCSV = (): void => {
    if (!analysisResults.value) return

    const results = allResults.value
    const headers = [
      '作業名稱',
      '文本內容',
      '相關性',
      '相關性信心度',
      '具體性',
      '具體性信心度',
      '建設性',
      '建設性信心度'
    ]

    const csvContent = [
      headers.join(','),
      ...results.map(item => {
        const homework = (item as any).homework || ''
        return [
          `"${homework}"`,
          `"${item.text.replace(/"/g, '""')}"`,
          item.predictions.relevance ? '1' : '0',
          item.predictions.relevance_confidence.toFixed(3),
          item.predictions.concreteness ? '1' : '0',
          item.predictions.concreteness_confidence.toFixed(3),
          item.predictions.constructive ? '1' : '0',
          item.predictions.constructive_confidence.toFixed(3)
        ].join(',')
      })
    ].join('\n')

    downloadFile(csvContent, 'analysis_results.csv', 'text/csv;charset=utf-8;')
  }

  const exportResultsAsJSON = (): void => {
    if (!analysisResults.value) return
    
    const jsonContent = JSON.stringify(analysisResults.value, null, 2)
    downloadFile(jsonContent, 'analysis_results.json', 'application/json')
  }

  const downloadFile = (content: string, filename: string, contentType: string): void => {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearResults = (): void => {
    analysisResults.value = null
    selectedFile.value = null
    analysisError.value = ''
  }

  const updateThreshold = (type: keyof AnalysisThresholds, value: number): void => {
    if (value >= 0 && value <= 1) {
      thresholds.value[type] = value
    }
  }

  // 在組件掛載時自動測試連接
  const init = async (): Promise<void> => {
    await testConnection()
  }

  return {
    // 狀態
    selectedFile,
    analyzing,
    analysisResults,
    analysisError,
    apiConnected,
    apiUrl,
    thresholds,
    
    // 計算屬性
    totalTexts,
    allResults,
    statisticsData,
    chartData,
    confidenceChartData,
    
    // 方法
    testConnection,
    handleFileSelect,
    performAnalysis,
    exportResultsAsCSV,
    exportResultsAsJSON,
    clearResults,
    updateThreshold,
    init
  }
}
