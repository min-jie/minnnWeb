import { apiConfig } from './apiConfig'

/**
 * Firebase 上傳 API 回應介面
 */
export interface FirebaseUploadResponse {
  status: 'success' | 'error'
  data?: {
    bucket: string
    name: string
    public_url?: string
    gs_uri?: string
  }
  message?: string
}

/**
 * API 統一回應格式
 */
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 上傳檔案選項
 */
export interface UploadOptions {
  destination?: string
  onProgress?: (progress: number) => void
  signal?: AbortSignal
}

/**
 * Firebase 檔案上傳 API 類別
 */
export class UploadFileAPI {
  private readonly baseURL: string

  constructor(baseURL?: string) {
    this.baseURL = baseURL || apiConfig.getBaseURL()
  }

  /**
   * 上傳檔案到 Firebase Storage
   * @param file 要上傳的檔案
   * @param options 上傳選項
   * @returns Promise<APIResponse<FirebaseUploadResponse['data']>>
   */
  async uploadToFirebase(
    file: File,
    options: UploadOptions = {}
  ): Promise<APIResponse<FirebaseUploadResponse['data']>> {
    try {
      // 驗證檔案
      const validation = this.validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      console.log('📤 開始上傳檔案到 Firebase Storage:')
      console.log('- 檔案名稱:', file.name)
      console.log('- 檔案大小:', this.formatFileSize(file.size))
      console.log('- 檔案類型:', file.type)
      console.log('- 目標路徑:', options.destination || '自動生成')

      // 創建 FormData
      const formData = new FormData()
      formData.append('file', file)
      
      // 如果指定了目標路徑，加入 destination 參數
      if (options.destination) {
        formData.append('destination', options.destination)
      }

      // 建立請求
      const requestOptions: RequestInit = {
        method: 'POST',
        body: formData,
        signal: options.signal
      }

      // 發送請求
      const response = await fetch(`${this.baseURL}/upload`, requestOptions)

      // 讀取回應
      const responseText = await response.text()
      console.log('📥 後端回應狀態:', response.status)
      console.log('📥 後端回應內容:', responseText)

      // 解析 JSON
      let responseData: FirebaseUploadResponse
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.error('JSON 解析失敗:', e)
        throw new Error(`後端回應無法解析: ${responseText}`)
      }

      // 檢查 HTTP 狀態碼
      if (!response.ok) {
        const errorMessage = this.getErrorMessage(response.status, responseData)
        throw new Error(errorMessage)
      }

      // 檢查業務邏輯錯誤
      if (responseData.status === 'error') {
        throw new Error(responseData.message || '上傳失敗')
      }

      console.log('✅ 檔案上傳成功!')
      console.log('- Bucket:', responseData.data?.bucket)
      console.log('- 檔案路徑:', responseData.data?.name)
      if (responseData.data?.public_url) {
        console.log('- 公開連結:', responseData.data.public_url)
      }
      if (responseData.data?.gs_uri) {
        console.log('- Storage URI:', responseData.data.gs_uri)
      }

      return {
        success: true,
        data: responseData.data
      }

    } catch (error: any) {
      console.error('❌ Firebase 上傳失敗:', error)
      
      // 處理不同類型的錯誤
      let errorMessage = '上傳失敗'
      
      if (error.name === 'AbortError') {
        errorMessage = '上傳已取消'
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 批次上傳多個檔案
   * @param files 檔案陣列
   * @param options 上傳選項（destination 會自動加上檔案名稱）
   * @returns Promise<APIResponse<FirebaseUploadResponse['data'][]>>
   */
  async uploadMultipleFiles(
    files: File[],
    options: Omit<UploadOptions, 'destination'> & { destinationFolder?: string } = {}
  ): Promise<APIResponse<FirebaseUploadResponse['data'][]>> {
    try {
      console.log(`📤 開始批次上傳 ${files.length} 個檔案`)

      const results: FirebaseUploadResponse['data'][] = []
      const errors: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const destination = options.destinationFolder 
          ? `${options.destinationFolder}/${file.name}`
          : `uploads/${file.name}`

        try {
          const result = await this.uploadToFirebase(file, {
            ...options,
            destination
          })

          if (result.success && result.data) {
            results.push(result.data)
          } else {
            errors.push(`${file.name}: ${result.error}`)
          }
        } catch (error: any) {
          errors.push(`${file.name}: ${error.message}`)
        }

        // 更新進度
        if (options.onProgress) {
          const progress = ((i + 1) / files.length) * 100
          options.onProgress(progress)
        }
      }

      if (errors.length > 0) {
        console.warn('⚠️ 部分檔案上傳失敗:', errors)
        if (results.length === 0) {
          return {
            success: false,
            error: `所有檔案上傳失敗: ${errors.join(', ')}`
          }
        }
      }

      console.log(`✅ 批次上傳完成，成功: ${results.length}，失敗: ${errors.length}`)

      return {
        success: true,
        data: results
      }

    } catch (error: any) {
      console.error('❌ 批次上傳失敗:', error)
      return {
        success: false,
        error: error?.message || '批次上傳失敗'
      }
    }
  }

  /**
   * 檢查後端連接狀態
   * @returns Promise<APIResponse<any>>
   */
  async checkConnection(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/health`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || '無法連接到後端服務' 
      }
    }
  }

  /**
   * 檔案驗證
   * @param file 檔案物件
   * @returns 驗證結果
   */
  private validateFile(file: File): { valid: boolean, error?: string } {
    // 檢查檔案是否存在
    if (!file) {
      return { valid: false, error: '檔案不存在' }
    }

    // 檢查檔案大小 (限制 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `檔案大小超過限制 (${this.formatFileSize(maxSize)})` 
      }
    }

    // 檢查檔案是否為空
    if (file.size === 0) {
      return { valid: false, error: '檔案不能為空' }
    }

    // 檢查檔案類型 (可選，根據需求調整)
    const allowedTypes = [
      'application/json',
      'text/json',
      'text/plain',
      'application/octet-stream'
    ]
    
    if (file.type && !allowedTypes.includes(file.type)) {
      console.warn('檔案類型可能不支援:', file.type)
      // 不阻擋上傳，只發出警告
    }

    return { valid: true }
  }

  /**
   * 格式化檔案大小
   * @param bytes 位元組數
   * @returns 格式化的檔案大小字串
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 根據 HTTP 狀態碼和回應資料產生錯誤訊息
   * @param status HTTP 狀態碼
   * @param responseData 回應資料
   * @returns 錯誤訊息
   */
  private getErrorMessage(status: number, responseData: FirebaseUploadResponse): string {
    // 優先使用後端提供的錯誤訊息
    if (responseData?.message) {
      return responseData.message
    }

    // 根據 HTTP 狀態碼提供通用錯誤訊息
    switch (status) {
      case 400:
        return '請求格式錯誤，請檢查檔案格式'
      case 401:
        return '未授權，請檢查 API 權限'
      case 403:
        return '禁止存取，請檢查檔案權限'
      case 404:
        return '找不到上傳端點，請檢查後端服務'
      case 413:
        return '檔案過大，請選擇較小的檔案'
      case 500:
        return '伺服器內部錯誤，可能是服務帳戶檔案遺失或 Firebase 設定問題'
      case 503:
        return '服務暫時無法使用，請稍後再試'
      default:
        return `上傳失敗 (HTTP ${status})`
    }
  }

  /**
   * 更新 API 基礎 URL
   * @param url 新的 API URL
   */
  setBaseURL(url: string): void {
    // 這裡不直接修改實例的 baseURL，而是更新 apiConfig
    apiConfig.setBaseURL(url)
  }
}

/**
 * 單例實例，方便在整個應用中使用
 */
export const uploadFileAPI = new UploadFileAPI()

/**
 * 便利函數：快速上傳單一檔案
 * @param file 檔案
 * @param destination 可選的目標路徑
 * @returns Promise<APIResponse<FirebaseUploadResponse['data']>>
 */
export const uploadFile = (
  file: File, 
  destination?: string
): Promise<APIResponse<FirebaseUploadResponse['data']>> => {
  return uploadFileAPI.uploadToFirebase(file, { destination })
}

/**
 * 便利函數：檢查上傳服務狀態
 * @returns Promise<APIResponse<any>>
 */
export const checkUploadService = (): Promise<APIResponse<any>> => {
  return uploadFileAPI.checkConnection()
}