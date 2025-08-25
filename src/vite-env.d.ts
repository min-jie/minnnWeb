/// <reference types="vite/client" />
// 擴展 Window 接口以支援全局變量
declare global {
  interface Window {
    vis?: any
    Chart?: any
    BubbleChartManager?: any
    processReviewerData?: any
    generateAllGraph?: any
    generateRelevanceGraph?: any
    generateConcretenessGraph?: any
    generateConstructiveGraph?: any
    updateGraphMode?: any
    updateNetworkInstance?: any
  }
}