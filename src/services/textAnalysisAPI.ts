// src/services/textAnalysisAPI.ts
import { apiConfig } from './apiConfig'

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface InferenceRequest {
  source: string
  output?: string
  verbose?: boolean
}

export interface InferenceResponse {
  status: 'success' | 'error'
  data?: {
    output: {
      bucket: string
      name: string
      gs_uri: string
      public_url?: string
    }
  }
  source?: string
  full_result?: any
  message?: string
  warning?: string
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

  // 上傳檔案到 Firebase Storage
  async uploadFileToStorage(
    file: File,
    destination?: string
  ): Promise<APIResponse<any>> {
    try {
      console.log('📤 上傳檔案到 Firebase Storage:', file.name)

      const formData = new FormData()
      formData.append('file', file)
      
      if (destination) {
        formData.append('destination', destination)
      }

      const response = await fetch(`${apiConfig.getBaseURL()}/upload`, {
        method: 'POST',
        body: formData
      })

      const responseText = await response.text()
      console.log('📥 上傳回應:', responseText)

      let payload = {}
      try {
        payload = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`回應解析失敗: ${responseText}`)
      }

      if (!response.ok) {
        const message = (payload as any).message || `上傳失敗: ${response.status}`
        throw new Error(message)
      }

      if ((payload as any).status === 'error') {
        throw new Error((payload as any).message || '上傳失敗')
      }

      return { success: true, data: payload }
    } catch (error: any) {
      console.error('❌ 上傳失敗:', error)
      return { success: false, error: error?.message || '上傳失敗' }
    }
  }

  // 🆕 新的推論 API：從 Firebase Storage 檔案進行推論
  async inferenceFromStorage(
    source: string,
    options: {
      output?: string
      verbose?: boolean
    } = {}
  ): Promise<APIResponse<InferenceResponse['data']>> {
    try {
      console.log('🔮 開始從 Storage 檔案進行推論:')
      console.log('- 來源檔案:', source)
      console.log('- 輸出檔案:', options.output || '自動生成')
      console.log('- 詳細模式:', options.verbose || false)

      // 強制啟用 verbose 模式，避免下載問題
      const requestBody: InferenceRequest = {
        source,
        verbose: true,  // 🔧 強制啟用
        ...options
      }

      // 🔧 也可以使用查詢參數方式
      const queryParams = new URLSearchParams()
      if (requestBody.verbose) {
        queryParams.append('verbose', '1')
      }
      
      const url = `${apiConfig.getBaseURL()}/inference${queryParams.toString() ? '?' + queryParams.toString() : ''}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const responseText = await response.text()
      console.log('📥 推論回應狀態:', response.status)
      console.log('📥 推論回應內容:', responseText.substring(0, 500))

      let responseData: InferenceResponse
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`回應解析失敗: ${responseText}`)
      }

      if (!response.ok) {
        const message = responseData.message || `API 錯誤: ${response.status}`
        throw new Error(message)
      }

      if (responseData.status === 'error') {
        throw new Error(responseData.message || 'API 回傳錯誤')
      }

      // 顯示推論結果資訊
      if (responseData.data?.output) {
        console.log('✅ 推論完成！')
        console.log('- 輸出檔案:', responseData.data.output.name)
        console.log('- Storage URI:', responseData.data.output.gs_uri)
        if (responseData.data.output.public_url) {
          console.log('- 公開連結:', responseData.data.output.public_url)
        }
      }

      // 檢查是否有完整結果
      if (responseData.full_result) {
        console.log('✅ 收到完整推論結果（verbose 模式）')
        // 將 full_result 附加到 data 中，便於後續處理
        if (responseData.data) {
          (responseData.data as any).full_result = responseData.full_result
        }
      }

      if (responseData.warning) {
        console.warn('⚠️ 推論警告:', responseData.warning)
      }

      return { success: true, data: responseData.data }
    } catch (error: any) {
      console.error('❌ Storage 推論失敗:', error)
      return { success: false, error: error?.message || 'Storage 推論失敗' }
    }
  }

  // 🆕 下載推論結果檔案
  async downloadInferenceResult(
    outputInfo: {
      bucket: string
      name: string
      gs_uri: string
      public_url?: string
    }
  ): Promise<APIResponse<any>> {
    try {
      console.log('📥 開始下載推論結果:', outputInfo.name)

      // 如果有公開連結，直接下載
      if (outputInfo.public_url) {
        console.log('🌐 使用公開連結下載')
        const response = await fetch(outputInfo.public_url)
        
        if (!response.ok) {
          throw new Error(`下載失敗: HTTP ${response.status}`)
        }

        const jsonData = await response.json()
        console.log('✅ 推論結果下載成功')
        return { success: true, data: jsonData }
      }

      // 如果沒有公開連結，嘗試通過後端代理下載
      console.log('🔒 檔案不公開，嘗試通過後端下載')
      
      // 這裡可能需要新的後端端點來代理下載
      // 或者提示用戶使用 Firebase Web SDK
      throw new Error('檔案不公開，需要使用 Firebase Web SDK 或後端代理下載')

    } catch (error: any) {
      console.error('❌ 下載推論結果失敗:', error)
      return { success: false, error: error?.message || '下載失敗' }
    }
  }

  // 🆕 完整的上傳 + 推論流程
  async uploadFileAndInference(
    file: File,
    options: {
      destination?: string
      outputPath?: string
      verbose?: boolean
    } = {}
  ): Promise<APIResponse<{
    uploadInfo: any
    inferenceInfo: InferenceResponse['data']
    inferenceResult?: any
  }>> {
    try {
      console.log('🚀 開始完整的上傳 + 推論流程')
      
      // 步驟 1: 上傳檔案
      const destination = options.destination || `data/${file.name}`
      const uploadResult = await this.uploadFileToStorage(file, destination)
      
      if (!uploadResult.success) {
        throw new Error(`檔案上傳失敗: ${uploadResult.error}`)
      }

      console.log('✅ 檔案上傳完成，開始推論...')

      // 步驟 2: 從上傳的檔案進行推論
      const source = (uploadResult.data as any)?.data?.name || destination
      const inferenceResult = await this.inferenceFromStorage(source, {
        output: options.outputPath,
        verbose: options.verbose
      })

      if (!inferenceResult.success) {
        throw new Error(`推論失敗: ${inferenceResult.error}`)
      }

      console.log('✅ 推論完成！')

      // 步驟 3: 如果是 verbose 模式或者有公開連結，嘗試下載結果
      let fullResult = undefined
      if (options.verbose && inferenceResult.data?.output) {
        const downloadResult = await this.downloadInferenceResult(inferenceResult.data.output)
        if (downloadResult.success) {
          fullResult = downloadResult.data
        } else {
          console.warn('⚠️ 無法下載完整結果:', downloadResult.error)
        }
      }

      return {
        success: true,
        data: {
          uploadInfo: uploadResult.data,
          inferenceInfo: inferenceResult.data,
          inferenceResult: fullResult
        }
      }

    } catch (error: any) {
      console.error('❌ 上傳 + 推論流程失敗:', error)
      return { success: false, error: error?.message || '流程失敗' }
    }
  }

  // 檔案上傳並分析（向後相容）
  async uploadFileForAnalysis(
    file: File,
    thresholds: number[] = [0.5, 0.5, 0.7]
  ): Promise<APIResponse<any>> {
    try {
      console.log('🚀 開始檔案上傳流程...')
      
      const uploadResult = await this.uploadFileToStorage(file, `data/${file.name}`)
      
      if (!uploadResult.success) {
        throw new Error(`檔案上傳失敗: ${uploadResult.error}`)
      }

      console.log('✅ 檔案上傳成功')
      
      return { 
        success: true, 
        data: {
          upload_info: uploadResult.data,
          message: '檔案已成功上傳',
          thresholds_used: thresholds
        }
      }

    } catch (error: any) {
      console.error('❌ 上傳分析失敗:', error)
      return { success: false, error: error?.message || '上傳失敗' }
    }
  }

  // JSON 資料推論 - 固定格式（向後相容）
  async inferAssignmentData(
    assignmentData: Record<string, any>,
    thresholds: number[] = [0.5, 0.5, 0.7]
  ): Promise<APIResponse<any>> {
    try {
      const payload = {
        ...assignmentData,
        thresholds: thresholds
      }

      console.log('📤 發送資料到 /infer')

      const response = await fetch(`${apiConfig.getBaseURL()}/infer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const responseText = await response.text()
      console.log('📥 /infer 回應:', responseText.substring(0, 200))

      let responseData = {}
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`回應解析失敗: ${responseText}`)
      }

      if (!response.ok) {
        const message = (responseData as any).message || `API 錯誤: ${response.status}`
        throw new Error(message)
      }

      if ((responseData as any).status === 'error') {
        throw new Error((responseData as any).message || 'API 回傳錯誤')
      }

      return { success: true, data: (responseData as any).data ?? responseData }
    } catch (error: any) {
      console.error('❌ 推論失敗:', error)
      return { success: false, error: error?.message || '推論失敗' }
    }
  }

  // 批次文字推論 - 固定格式（向後相容）
  async inferTexts(
    texts: string[],
    batch_size?: number,
    thresholds: number[] = [0.5, 0.5, 0.7]
  ): Promise<APIResponse<any>> {
    try {
      const payload: Record<string, any> = { 
        texts: texts,
        thresholds: thresholds 
      }
      
      if (batch_size) {
        payload.batch_size = batch_size
      }

      console.log('📤 發送文字陣列到 /infer，數量:', texts.length)

      const response = await fetch(`${apiConfig.getBaseURL()}/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseText = await response.text()
      console.log('📥 批次推論回應:', responseText.substring(0, 200))

      let responseData = {}
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`回應解析失敗: ${responseText}`)
      }

      if (!response.ok) {
        throw new Error((responseData as any).message || `API 錯誤: ${response.status}`)
      }

      if ((responseData as any).status === 'error') {
        throw new Error((responseData as any).message || 'API 回傳錯誤')
      }

      return { success: true, data: (responseData as any).data ?? responseData }
    } catch (error: any) {
      console.error('❌ 批次推論失敗:', error)
      return { success: false, error: error?.message || '批次推論失敗' }
    }
  }

  // 分析 JSON 檔案（向後相容）
  async analyzeJSON(
    jsonData: Record<string, any[]>,
    thresholds: number[] = [0.5, 0.5, 0.7]
  ): Promise<APIResponse<any>> {
    return this.inferAssignmentData(jsonData, thresholds)
  }

  // 讀取檔案為 JSON
  readFileAsJSON(file: File): Promise<Record<string, any[]>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const jsonData = JSON.parse(content)
          console.log('📖 讀取 JSON 檔案成功')
          resolve(jsonData)
        } catch (error) {
          console.error('❌ JSON 解析錯誤:', error)
          reject(new Error('JSON 格式錯誤'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('檔案讀取失敗'))
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }

  // 檔案驗證
  validateFile(file: File): { valid: boolean, error?: string } {
    if (!file.name.endsWith('.json')) {
      return { valid: false, error: '請選擇 JSON 檔案' }
    }

    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: '檔案過大 (>50MB)' }
    }

    if (file.size === 0) {
      return { valid: false, error: '檔案為空' }
    }

    return { valid: true }
  }
}

// 單例模式
export const textAnalysisAPI = new TextAnalysisAPI()
