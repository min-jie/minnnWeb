// src/services/apiConfig.ts
import { ref, type Ref } from 'vue'

// 集中管理 API Base URL（不使用環境變數）
const baseURL: Ref<string> = ref('https://api.moriiikumo.com')

export const apiConfig = {
  // 可供元件雙向綁定的反應式值
  baseURL,

  // 讀取目前 Base URL（供 services 使用）
  getBaseURL(): string {
    return baseURL.value
  },

  // 設定 Base URL（供 UI 或其他邏輯調整）
  setBaseURL(url: string): void {
    baseURL.value = url
  }
}