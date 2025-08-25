// src/composables/useTextAnalysis.ts
import { ref, computed, type Ref } from 'vue'
import { textAnalysisAPI, type APIResponse } from '../services/textAnalysisAPI'
import { apiConfig } from '../services/apiConfig'

// 簡化的型別定義
export interface AnalysisThresholds {
  relevance: number
  concreteness: number
  constructive: number
}

export interface AnalysisResults {
  status?: string
  data?: any
  detailed_results?: Array<{
    homework: string
    assignment_id: string
    feedback: string
    relevance: number
    concreteness: number
    constructive: number
    relevance_confidence: number
    concreteness_confidence: number
    constructive_confidence: number
  }>
  total_feedbacks?: number
  total_processed?: number
  thresholds_used?: number[]
}

export interface AnalysisItem {
  text: string
  homework?: string
  assignment_id?: string
  predictions: {
    relevance: boolean
    relevance_confidence: number
    concreteness: boolean
    concreteness_confidence: number
    constructive: boolean
    constructive_confidence: number
  }
}

export function useTextAnalysis() {
  // 反應式狀態
  const selectedFile: Ref<File | null> = ref(null)
  const analyzing = ref(false)
  const analysisResults: Ref<AnalysisResults | null> = ref(null)
  const analysisError = ref('')
  const apiConnected = ref(false)
  const apiUrl = apiConfig.baseURL
  
  const thresholds = ref<AnalysisThresholds>({
    relevance: 0.5,
    concreteness: 0.5,
    constructive: 0.5
  })

  // 計算屬性
  const totalTexts = computed(() => {
    if (!analysisResults.value) return 0
    
    // 新 API 格式
    if (analysisResults.value.total_feedbacks !== undefined) {
      return analysisResults.value.total_feedbacks
    }
    
    // 舊格式向後相容
    if (analysisResults.value.total_processed !== undefined) {
      return analysisResults.value.total_processed
    }
    
    // 從詳細結果計算
    if (analysisResults.value.detailed_results) {
      return analysisResults.value.detailed_results.length
    }
    
    return 0
  })

  const allResults = computed((): AnalysisItem[] => {
    if (!analysisResults.value) return []
    
    // 處理新 API 格式的 detailed_results
    if (analysisResults.value.detailed_results && Array.isArray(analysisResults.value.detailed_results)) {
      return analysisResults.value.detailed_results.map((item: any) => ({
        text: item.feedback,
        predictions: {
          relevance: item.relevance === 1,
          relevance_confidence: item.relevance_confidence,
          concreteness: item.concreteness === 1,
          concreteness_confidence: item.concreteness_confidence,
          constructive: item.constructive === 1,
          constructive_confidence: item.constructive_confidence
        },
        homework: item.homework,
        assignment_id: item.assignment_id
      }))
    }

    return []
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

  // 方法
  const testConnection = async (): Promise<boolean> => {
    try {
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

  const handleFileSelect = async (file: File | null): Promise<boolean> => {
    if (!file) {
      selectedFile.value = null
      analysisError.value = ''
      return false
    }

    // 使用新的檔案驗證方法
    const validation = textAnalysisAPI.validateFile(file)
    if (!validation.valid) {
      analysisError.value = validation.error || '檔案驗證失敗'
      selectedFile.value = null
      return false
    }

    selectedFile.value = file
    analysisError.value = ''
    
    console.log('✅ 檔案選擇成功:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
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
      console.log('🚀 開始上傳檔案進行分析...')
      
      // 直接上傳檔案，不在前端解析
      const result = await textAnalysisAPI.uploadFileForAnalysis(selectedFile.value, [
        thresholds.value.relevance,
        thresholds.value.concreteness,
        thresholds.value.constructive
      ])

      if (result.success && result.data) {
        analysisResults.value = result.data
        console.log('✅ 分析完成！結果:', result.data)
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
      '作業ID',
      '回饋內容',
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
        return [
          `"${item.homework || ''}"`,
          `"${item.assignment_id || ''}"`,
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
