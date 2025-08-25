// src/services/textAnalysisAPI.ts
import { apiConfig } from '@/services/apiConfig'

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export class TextAnalysisAPI {
  constructor() {
    // 統一由 apiConfig 管理 baseURL
  }

  // 更新 API 地址
  updateBaseURL(url: string) {
    apiConfig.setBaseURL(url)
  }

  // 測試 API 連接
  async testConnection(): Promise<APIResponse<{ message: string }>> {
    try {
      const response = await fetch(`${apiConfig.getBaseURL()}/health`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // 直接上傳檔案到後端進行處理
  async uploadFileForAnalysis(
    file: File,
    thresholds: number[] = [0.5, 0.5, 0.7]
  ): Promise<APIResponse<any>> {
    try {
      console.log('📤 準備上傳檔案到後端:')
      console.log('- 檔案名稱:', file.name)
      console.log('- 檔案大小:', file.size, 'bytes')
      console.log('- 檔案類型:', file.type)
      console.log('- 閾值:', thresholds)

      // 創建 FormData 來上傳檔案
      const formData = new FormData()
      formData.append('file', file)
      formData.append('thresholds', JSON.stringify(thresholds))

      console.log('📤 使用 FormData 上傳檔案...')

      const response = await fetch(`${apiConfig.getBaseURL()}/infer`, {
        method: 'POST',
        body: formData
        // 注意：不要設置 Content-Type header，讓瀏覽器自動設置 multipart/form-data
      })

      // 先讀取原始回應文字
      const responseText = await response.text()
      console.log('📥 後端原始回應狀態:', response.status)
      console.log('📥 後端原始回應內容:', responseText.substring(0, 500))

      // 嘗試解析 JSON
      let payload = {}
      try {
        payload = JSON.parse(responseText)
      } catch (e) {
        console.error('JSON 解析失敗:', e)
        throw new Error(`後端回應無法解析: ${responseText}`)
      }

      console.log('📥 後端解析後回應:', payload)

      if (!response.ok) {
        const message = (payload as any).message || `API 錯誤: ${response.status}`
        throw new Error(message)
      }

      if (payload && (payload as any).status === 'error') {
        throw new Error((payload as any).message || 'API 回傳錯誤')
      }

      return { success: true, data: (payload as any).data ?? payload }
    } catch (error: any) {
      console.error('❌ textAnalysisAPI.uploadFileForAnalysis error:', error)
      return { success: false, error: error?.message || '未知錯誤' }
    }
  }

  // 保留舊的方法以防向後相容需求
  async inferAssignmentData(
    assignmentData: Record<string, any>,
    thresholds: number[] = [0.5, 0.5, 0.7]
  ): Promise<APIResponse<any>> {
    try {
      const validThresholds = thresholds.map(t => parseFloat(t.toString()))
      
      const payloadToSend = {
        ...assignmentData,
        thresholds: validThresholds
      }

      console.log('📤 發送 JSON 資料到後端:', JSON.stringify(payloadToSend, null, 2).substring(0, 300))

      const response = await fetch(`${apiConfig.getBaseURL()}/infer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadToSend)
      })

      const responseText = await response.text()
      console.log('📥 後端回應:', responseText.substring(0, 500))

      let payload = {}
      try {
        payload = JSON.parse(responseText)
      } catch (e) {
        console.error('JSON 解析失敗:', e)
        throw new Error(`後端回應無法解析: ${responseText}`)
      }

      if (!response.ok) {
        const message = (payload as any).message || `API 錯誤: ${response.status}`
        throw new Error(message)
      }

      if (payload && (payload as any).status === 'error') {
        throw new Error((payload as any).message || 'API 回傳錯誤')
      }

      return { success: true, data: (payload as any).data ?? payload }
    } catch (error: any) {
      console.error('❌ textAnalysisAPI.inferAssignmentData error:', error)
      return { success: false, error: error?.message || '未知錯誤' }
    }
  }

  // 分析 JSON 檔案 - 相容性方法（現在使用檔案上傳）
  async analyzeJSON(
    jsonData: Record<string, any[]>,
    thresholds: number[] = [0.5, 0.5, 0.7]
  ): Promise<APIResponse<any>> {
    console.warn('analyzeJSON 已改為使用檔案上傳模式，請改用 uploadFileForAnalysis')
    return this.inferAssignmentData(jsonData, thresholds)
  }

  // 移除 readFileAsJSON 方法，因為不再需要前端解析
  // 保留一個簡單的檔案驗證方法
  validateFile(file: File): { valid: boolean, error?: string } {
    if (!file.name.endsWith('.json')) {
      return { valid: false, error: '請選擇 JSON 格式的檔案' }
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB 限制
      return { valid: false, error: '檔案大小不能超過 50MB' }
    }

    if (file.size === 0) {
      return { valid: false, error: '檔案不能為空' }
    }

    return { valid: true }
  }
}

// 單例模式
export const textAnalysisAPI = new TextAnalysisAPI()
