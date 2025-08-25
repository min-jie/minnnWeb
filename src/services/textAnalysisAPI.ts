// src/services/textAnalysisAPI.ts
export interface AnalysisThresholds {
  relevance: number;
  concreteness: number;
  constructive: number;
}

export interface PredictionResult {
  relevance: boolean;
  relevance_confidence: number;
  concreteness: boolean;
  concreteness_confidence: number;
  constructive: boolean;
  constructive_confidence: number;
}

export interface AnalysisItem {
  text: string;
  predictions: PredictionResult;
  index?: number;
  original_data?: any;
}

export interface AnalysisResults {
  results: Record<string, AnalysisItem[]>;
  total_processed: number;
  thresholds_used: number[];
  model_type: string;
  uncertain_cases?: any[];
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TextAnalysisAPI {
  private baseURL: string;

  constructor(baseURL = 'http://127.0.0.1:8000') {
    this.baseURL = baseURL;
  }

  // 更新 API 地址
  updateBaseURL(url: string) {
    this.baseURL = url;
  }

  // 測試 API 連接
  async testConnection(): Promise<APIResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 分析 JSON 檔案（呼叫後端 /infer）
  async analyzeJSON(
    jsonData: Record<string, any[]>,
    thresholds: number[] = [0.5, 0.5, 0.5]
  ): Promise<APIResponse<AnalysisResults>> {
    try {
      const payloadToSend = {
        assignment_data: jsonData,
        thresholds: thresholds
      }

      // 日誌：印出即將送出的 payload，方便確認前端解析結果
      console.debug('textAnalysisAPI.analyzeJSON -> sending payload:', payloadToSend)

      const response = await fetch(`${this.baseURL}/infer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadToSend)
      });

      // 嘗試解析回應 JSON（有時錯誤仍以 200 回傳）
      const payload = await response.json().catch(() => ({}))

      // 日誌：記錄 response 狀態與回傳內容，方便除錯
      console.debug('textAnalysisAPI.analyzeJSON <- response status:', response.status, 'payload:', payload)

      if (!response.ok) {
        const message = payload.message || `API 錯誤: ${response.status}`
        throw new Error(message)
      }

      // 後端回傳格式預期為:
      // { status: 'success'|'error', data: {...}, message?: '...' }
      if (payload && payload.status === 'error') {
        throw new Error(payload.message || 'API 回傳錯誤')
      }

      // 兼容性：有些實作直接回傳 data，或回傳整個 payload
      const data = payload.data ?? payload
      return { success: true, data: data }
    } catch (error: any) {
      console.error('textAnalysisAPI.analyzeJSON error:', error)
      return { success: false, error: error?.message || '未知錯誤' }
    }
  }

  // 讀取檔案內容
  readFileAsJSON(file: File): Promise<Record<string, any[]>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('JSON 格式錯誤，請檢查檔案內容'));
        }
      };
      reader.onerror = () => reject(new Error('檔案讀取失敗'));
      reader.readAsText(file);
    });
  }

  // 獲取模型資訊
  async getModelInfo(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/model_info`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { success: true, data: data.model };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 單條文字推論（方便前端即時呼叫）
  async inferText(
    text: string,
    thresholds: number[] = [0.5, 0.5, 0.5]
  ): Promise<APIResponse<any>> {
    try {
      const payloadToSend = { text, thresholds }
      console.debug('textAnalysisAPI.inferText -> sending payload:', payloadToSend)

      const response = await fetch(`${this.baseURL}/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSend)
      })

      const payload = await response.json().catch(() => ({}))
      console.debug('textAnalysisAPI.inferText <- response status:', response.status, 'payload:', payload)

      if (!response.ok) {
        throw new Error(payload.message || `API 錯誤: ${response.status}`)
      }

      if (payload && payload.status === 'error') {
        throw new Error(payload.message || 'API 回傳錯誤')
      }

      return { success: true, data: payload.data ?? payload }
    } catch (error: any) {
      console.error('textAnalysisAPI.inferText error:', error)
      return { success: false, error: error?.message || '未知錯誤' }
    }
  }

  // 批次文字推論（texts 陣列，可選 batch_size）
  async inferTexts(
    texts: string[],
    batch_size?: number,
    thresholds: number[] = [0.5, 0.5, 0.5]
  ): Promise<APIResponse<any>> {
    try {
      const body: Record<string, any> = { texts, thresholds }
      if (typeof batch_size === 'number') body.batch_size = batch_size

      console.debug('textAnalysisAPI.inferTexts -> sending payload sample:', { texts_count: texts.length, batch_size, thresholds })

      const response = await fetch(`${this.baseURL}/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const payload = await response.json().catch(() => ({}))
      console.debug('textAnalysisAPI.inferTexts <- response status:', response.status, 'payload:', payload)

      if (!response.ok) {
        throw new Error(payload.message || `API 錯誤: ${response.status}`)
      }

      if (payload && payload.status === 'error') {
        throw new Error(payload.message || 'API 回傳錯誤')
      }

      return { success: true, data: payload.data ?? payload }
    } catch (error: any) {
      console.error('textAnalysisAPI.inferTexts error:', error)
      return { success: false, error: error?.message || '未知錯誤' }
    }
  }
}
 
// 單例模式，全域使用同一個實例
export const textAnalysisAPI = new TextAnalysisAPI();
