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
      const response = await fetch(`${this.baseURL}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 分析 JSON 檔案
  async analyzeJSON(
    jsonData: Record<string, any[]>,
    thresholds: number[] = [0.5, 0.5, 0.5]
  ): Promise<APIResponse<AnalysisResults>> {
    try {
      const response = await fetch(`${this.baseURL}/api/analyze_json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_data: jsonData,
          thresholds: thresholds
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API 錯誤: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: error.message };
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
      const response = await fetch(`${this.baseURL}/api/model_info`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { success: true, data: data.model };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// 單例模式，全域使用同一個實例
export const textAnalysisAPI = new TextAnalysisAPI();
