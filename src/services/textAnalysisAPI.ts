// src/services/textAnalysisAPI.ts
import { apiConfig } from "./apiConfig";
import { storage } from "../firebase";
import { ref, getDownloadURL, getBlob } from "firebase/storage"; // 添加 getBlob

// 增加超時設定
const TIMEOUT_MS = 300000; // 5分鐘，因為文本分析可能需要較長時間

// 創建帶超時的 fetch 函數
const fetchWithTimeout = (
  url: string,
  options: RequestInit = {},
  timeout = TIMEOUT_MS,
) => {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("請求超時")), timeout),
    ),
  ]);
};

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InferenceRequest {
  source: string;
  output?: string;
}

export interface InferenceResponse {
  status: "success" | "error";
  data?: {
    output: {
      bucket: string;
      name: string;
      gs_uri: string;
      public_url?: string;
    };
  };
  source?: string;
  full_result?: any;
  message?: string;
  warning?: string;
}

export class TextAnalysisAPI {
  constructor() {
    // 統一由 apiConfig 管理 baseURL
  }

  // 更新 API 地址
  updateBaseURL(url: string) {
    apiConfig.setBaseURL(url);
  }

  // 測試 API 連接
  async testConnection(): Promise<APIResponse<{ message: string }>> {
    try {
      const response = await fetchWithTimeout(
        `${apiConfig.getBaseURL()}/health`,
        {},
        10000,
      ); // 10秒超時
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 上傳檔案到 Firebase Storage
  async uploadFileToStorage(
    file: File,
    destination?: string,
  ): Promise<APIResponse<any>> {
    try {
      console.log("📤 上傳檔案到 Firebase Storage:", file.name);

      const formData = new FormData();
      formData.append("file", file);

      if (destination) {
        formData.append("destination", destination);
      }

      const response = await fetch(`${apiConfig.getBaseURL()}/upload`, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      console.log("📥 上傳回應:", responseText);

      let payload = {};
      try {
        payload = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`回應解析失敗: ${responseText}`);
      }

      if (!response.ok) {
        const message =
          (payload as any).message || `上傳失敗: ${response.status}`;
        throw new Error(message);
      }

      if ((payload as any).status === "error") {
        throw new Error((payload as any).message || "上傳失敗");
      }

      return { success: true, data: payload };
    } catch (error: any) {
      console.error("❌ 上傳失敗:", error);
      return { success: false, error: error?.message || "上傳失敗" };
    }
  }

  // 🆕 新的推論 API：從 Firebase Storage 檔案進行推論
  async inferenceFromStorage(
    source: string,
    options: {
      output?: string;
    } = {},
  ): Promise<{ task_id: string; status: string; message: string }> {
    try {
      console.log("🔮 開始從 Storage 檔案進行推論:");
      console.log("- 來源檔案:", source);

      const requestBody = {
        source,
        ...options,
      };

      const url = `${apiConfig.getBaseURL()}/inference`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("📥 推論回應狀態:", response.status);
      console.log("📥 推論回應內容:", responseText);

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`回應解析失敗: ${responseText}`);
      }

      if (!response.ok) {
        const message = responseData.message || `API 錯誤: ${response.status}`;
        throw new Error(message);
      }

      // 檢查回應是否包含 task_id
      if (!responseData.task_id) {
        throw new Error("API 回應格式錯誤: 缺少 task_id");
      }

      console.log("✅ 推論任務已建立:", responseData.task_id);

      return {
        task_id: responseData.task_id,
        status: responseData.status || "PENDING",
        message: responseData.message || "推論任務已建立",
      };
    } catch (error: any) {
      console.error("❌ Storage 推論失敗:", error);
      throw error;
    }
  }

  // 🆕 下載推論結果檔案
  // 🆕 下載推論結果 (支援 gs:// URI 和 outputInfo 格式)
  async downloadInferenceResult(
    input:
      | string
      | {
          bucket: string;
          name: string;
          gs_uri: string;
          public_url?: string;
        },
  ): Promise<APIResponse<any>> {
    try {
      if (typeof input === "string") {
        // 處理 gs:// URI 格式
        console.log("📥 下載推論結果 (gs:// URI):", input);

        // 解析 gs:// URI
        const gsMatch = input.match(/^gs:\/\/([^\/]+)\/(.+)$/);
        if (!gsMatch) {
          throw new Error("無效的 gs:// URI 格式");
        }

        const [, , path] = gsMatch;
        console.log(`📂 從 Firebase Storage 下載: ${path}`);

        // 使用已導入的 Firebase Storage SDK
        const fileRef = ref(storage, path);

        try {
          // 方法1：使用 getBlob 直接下載（避免 CORS）
          console.log("🔄 使用 getBlob 直接下載...");
          const blob = await getBlob(fileRef);
          const text = await blob.text();
          const jsonData = JSON.parse(text);

          console.log("✅ 成功下載推論結果 (getBlob)");
          return { success: true, data: jsonData };
        } catch (blobError) {
          console.warn(
            "⚠️ getBlob 下載失敗，嘗試 downloadURL 方式:",
            blobError,
          );

          // 方法2：備用方案 - 使用下載 URL
          const downloadURL = await getDownloadURL(fileRef);
          console.log("🔗 取得下載 URL，嘗試 fetch...");

          const response = await fetch(downloadURL);
          if (!response.ok) {
            throw new Error(
              `下載失敗: ${response.status} ${response.statusText}`,
            );
          }

          const jsonData = await response.json();
          console.log("✅ 成功下載推論結果 (downloadURL)");
          return { success: true, data: jsonData };
        }
      } else {
        // 處理 outputInfo 格式
        console.log("📥 下載推論結果 (outputInfo):", input.name);
        return await this.downloadInferenceResultWithFirebase(input);
      }
    } catch (error: any) {
      console.error("❌ 下載推論結果失敗:", error);
      return {
        success: false,
        error: error?.message || "下載失敗",
      };
    }
  }

  // 🆕 使用 Firebase Web SDK 下載推論結果檔案
  async downloadInferenceResultWithFirebase(outputInfo: {
    bucket: string;
    name: string;
    gs_uri: string;
    public_url?: string;
  }): Promise<APIResponse<any>> {
    try {
      console.log("📥 使用 Firebase SDK 下載推論結果:", outputInfo.name);

      // 建立 Firebase Storage 參考
      const storageRef = ref(storage, outputInfo.name);

      try {
        // 方法1：直接使用 getBlob（推薦）
        console.log("🔄 使用 getBlob 下載...");
        const blob = await getBlob(storageRef);
        const text = await blob.text();
        const jsonData = JSON.parse(text);

        console.log(
          "✅ Firebase getBlob 下載成功，資料大小:",
          JSON.stringify(jsonData).length,
          "字元",
        );
        return { success: true, data: jsonData };
      } catch (blobError) {
        console.warn("⚠️ getBlob 失敗，使用 downloadURL 備用方案:", blobError);

        // 方法2：備用方案
        const downloadURL = await getDownloadURL(storageRef);
        console.log("🔗 取得 Firebase 下載連結");

        const response = await fetch(downloadURL);
        if (!response.ok) {
          throw new Error(`Firebase 下載失敗: HTTP ${response.status}`);
        }

        const jsonData = await response.json();
        console.log(
          "✅ Firebase downloadURL 下載成功，資料大小:",
          JSON.stringify(jsonData).length,
          "字元",
        );
        return { success: true, data: jsonData };
      }
    } catch (error: any) {
      console.error("❌ Firebase 下載推論結果失敗:", error);
      return {
        success: false,
        error: error?.message || "Firebase 下載失敗",
      };
    }
  }

  // 🆕 根據 task_id 從 Firestore 獲取結果並下載
  async downloadResultFromTask(taskId: string): Promise<APIResponse<any>> {
    try {
      console.log("📥 嘗試從任務獲取結果:", taskId);

      // 這裡可以實現從 Firestore 獲取任務狀態，然後下載結果
      // 現在先返回一個暫時的實現
      console.log("⚠️ downloadResultFromTask 尚未完全實現");

      return { success: false, error: "功能尚未實現" };
    } catch (error: any) {
      console.error("❌ 從任務下載結果失敗:", error);
      return { success: false, error: error?.message || "下載失敗" };
    }
  }

  // 🆕 完整的上傳 + 推論流程 (使用新的任務型 API)
  async uploadFileAndInferenceWithTask(
    file: File,
    options: {
      destination?: string;
      outputPath?: string;
    } = {},
  ): Promise<{
    task_id: string;
    status: string;
    message: string;
    uploadInfo: any;
  }> {
    try {
      console.log("🚀 開始完整的上傳 + 推論流程 (任務型)");

      // 步驟 1: 上傳檔案
      const destination = options.destination || `data/${file.name}`;
      const uploadResult = await this.uploadFileToStorage(file, destination);

      if (!uploadResult.success) {
        throw new Error(`檔案上傳失敗: ${uploadResult.error}`);
      }

      console.log("✅ 檔案上傳完成，開始建立推論任務...");

      // 步驟 2: 建立推論任務
      const source = (uploadResult.data as any)?.data?.name || destination;
      const inferenceResult = await this.inferenceFromStorage(source, {
        output: options.outputPath,
      });

      return {
        ...inferenceResult,
        uploadInfo: uploadResult.data,
      };
    } catch (error: any) {
      console.error("❌ 上傳 + 推論流程失敗:", error);
      throw error;
    }
  }

  // 保留舊的函數以維持向後相容性（標記為廢棄）
  /** @deprecated 使用 uploadFileAndInferenceWithTask 替代 */
  async uploadFileAndInference(
    file: File,
    options: {
      destination?: string;
      outputPath?: string;
    } = {},
  ): Promise<
    APIResponse<{
      uploadInfo: any;
      inferenceInfo: InferenceResponse["data"];
      inferenceResult?: any;
    }>
  > {
    try {
      console.log("🚀 開始完整的上傳 + 推論流程");

      // 步驟 1: 上傳檔案
      const destination = options.destination || `data/${file.name}`;
      const uploadResult = await this.uploadFileToStorage(file, destination);

      if (!uploadResult.success) {
        throw new Error(`檔案上傳失敗: ${uploadResult.error}`);
      }

      console.log("✅ 檔案上傳完成，開始建立推論任務...");

      // 步驟 2: 建立推論任務（新的任務型 API）
      const source = (uploadResult.data as any)?.data?.name || destination;
      const inferenceResult = await this.inferenceFromStorage(source, {
        output: options.outputPath,
      });

      console.log("✅ 推論任務已建立！");

      // 注意：新的 API 不會立即返回結果，需要通過 Firestore 監聽
      return {
        success: true,
        data: {
          uploadInfo: uploadResult.data,
          inferenceInfo: inferenceResult as any, // 新的任務型 API 返回格式不同
          inferenceResult: undefined, // 新的 API 需要通過 Firestore 監聽獲取結果
        },
      };
    } catch (error: any) {
      console.error("❌ 上傳 + 推論流程失敗:", error);
      return { success: false, error: error?.message || "流程失敗" };
    }
  }

  // 檔案上傳並分析（向後相容）
  async uploadFileForAnalysis(
    file: File,
    thresholds: number[] = [0.5, 0.5, 0.7],
  ): Promise<APIResponse<any>> {
    try {
      console.log("🚀 開始檔案上傳流程...");

      const uploadResult = await this.uploadFileToStorage(
        file,
        `data/${file.name}`,
      );

      if (!uploadResult.success) {
        throw new Error(`檔案上傳失敗: ${uploadResult.error}`);
      }

      console.log("✅ 檔案上傳成功");

      return {
        success: true,
        data: {
          upload_info: uploadResult.data,
          message: "檔案已成功上傳",
          thresholds_used: thresholds,
        },
      };
    } catch (error: any) {
      console.error("❌ 上傳分析失敗:", error);
      return { success: false, error: error?.message || "上傳失敗" };
    }
  }

  // JSON 資料推論 - 固定格式（向後相容）
  async inferAssignmentData(
    assignmentData: Record<string, any>,
    thresholds: number[] = [0.5, 0.5, 0.7],
  ): Promise<APIResponse<any>> {
    try {
      const payload = {
        ...assignmentData,
        thresholds: thresholds,
      };

      console.log("📤 發送資料到 /infer");

      const response = await fetch(`${apiConfig.getBaseURL()}/infer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("📥 /infer 回應:", responseText.substring(0, 200));

      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`回應解析失敗: ${responseText}`);
      }

      if (!response.ok) {
        const message =
          (responseData as any).message || `API 錯誤: ${response.status}`;
        throw new Error(message);
      }

      if ((responseData as any).status === "error") {
        throw new Error((responseData as any).message || "API 回傳錯誤");
      }

      return {
        success: true,
        data: (responseData as any).data ?? responseData,
      };
    } catch (error: any) {
      console.error("❌ 推論失敗:", error);
      return { success: false, error: error?.message || "推論失敗" };
    }
  }

  // 批次文字推論 - 固定格式（向後相容）
  async inferTexts(
    texts: string[],
    batch_size?: number,
    thresholds: number[] = [0.5, 0.5, 0.7],
  ): Promise<APIResponse<any>> {
    try {
      const payload: Record<string, any> = {
        texts: texts,
        thresholds: thresholds,
      };

      if (batch_size) {
        payload.batch_size = batch_size;
      }

      console.log("📤 發送文字陣列到 /infer，數量:", texts.length);

      const response = await fetch(`${apiConfig.getBaseURL()}/infer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("📥 批次推論回應:", responseText.substring(0, 200));

      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`回應解析失敗: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(
          (responseData as any).message || `API 錯誤: ${response.status}`,
        );
      }

      if ((responseData as any).status === "error") {
        throw new Error((responseData as any).message || "API 回傳錯誤");
      }

      return {
        success: true,
        data: (responseData as any).data ?? responseData,
      };
    } catch (error: any) {
      console.error("❌ 批次推論失敗:", error);
      return { success: false, error: error?.message || "批次推論失敗" };
    }
  }

  // 分析 JSON 檔案（向後相容）
  async analyzeJSON(
    jsonData: Record<string, any[]>,
    thresholds: number[] = [0.5, 0.5, 0.7],
  ): Promise<APIResponse<any>> {
    return this.inferAssignmentData(jsonData, thresholds);
  }

  // 讀取檔案為 JSON
  readFileAsJSON(file: File): Promise<Record<string, any[]>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          console.log("📖 讀取 JSON 檔案成功");
          resolve(jsonData);
        } catch (error) {
          console.error("❌ JSON 解析錯誤:", error);
          reject(new Error("JSON 格式錯誤"));
        }
      };

      reader.onerror = () => {
        reject(new Error("檔案讀取失敗"));
      };

      reader.readAsText(file, "UTF-8");
    });
  }

  // 檔案驗證
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file.name.endsWith(".json")) {
      return { valid: false, error: "請選擇 JSON 檔案" };
    }

    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: "檔案過大 (>50MB)" };
    }

    if (file.size === 0) {
      return { valid: false, error: "檔案為空" };
    }

    return { valid: true };
  }
}

// 單例模式
export const textAnalysisAPI = new TextAnalysisAPI();
