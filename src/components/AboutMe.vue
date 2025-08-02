<template>
  <div class="min-h-screen w-full" style="background: linear-gradient(135deg, #E8F4F8 0%, #D6EDF6 100%); margin: 0; padding: 0;">
    <NavBar />
    <main class="py-12 w-full">
      <div class="px-16 space-y-8 max-w-5xl mx-auto">
        
        <!-- 大家好區塊卡片 -->
        <div class="p-16 bg-white border border-gray-200 rounded-3xl shadow-lg" style="margin: 32px; background: white; border-radius: 24px; padding: 24px 48px;">
          <!-- 標題 -->
          <h2 class="text-2xl font-medium mb-6 text-blue-600" style="font-family: 'Noto Sans TC', sans-serif;">
            大家好，這裡是 Minnn-
          </h2>
          
          <!-- 基本資訊 -->
          <div class="space-y-3 mb-6">
            <div class="flex items-center">
              <span class="inline-block w-2 h-2 bg-gray-400 rounded-full mr-4"></span>
              <span class="text-gray-600 text-base" style="font-family: 'Noto Sans TC', sans-serif;">台灣 高雄市</span>
            </div>
            <div class="flex items-center">
              <span class="inline-block w-2 h-2 bg-gray-400 rounded-full mr-4"></span>
              <span class="text-gray-600 text-base" style="font-family: 'Noto Sans TC', sans-serif;">逢甲大學資訊工程碩士</span>
            </div>
            <div class="flex items-center">
              <span class="inline-block w-2 h-2 bg-gray-400 rounded-full mr-4"></span>
              <span class="text-gray-600 text-base" style="font-family: 'Noto Sans TC', sans-serif;">我的履歷</span>
            </div>
          </div>

          <!-- 關於我內容 -->
          <div class="space-y-4">
            <p class="text-base leading-relaxed text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              今年2025年8月份從逢甲大學資訊工程研究所的軟體工程實驗室畢業
            </p>
            <p class="text-base leading-relaxed text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              專業領域為軟體開發、前端設計，以及UI/UX設計，平時也喜愛繪畫及創作，論文研究向為 NLP 相關結合學生程式碼評論品質分析
            </p>
          </div>
        </div>

        <!-- 專業經歷區塊卡片 -->
        <div class="p-16 bg-white border border-gray-200 rounded-3xl shadow-lg" style="margin: 32px; background: white; border-radius: 24px; padding: 24px 48px;">
          <!-- 專業經驗標題 -->
          <div class="mb-8">
            <div style="background-color: #52ACD0; border-radius: 12px; padding: 8px 16px; display: inline-block;">
              <h2 style="font-family: 'Noto Sans TC', sans-serif; color: #EEFAFF; font-size: 16px; font-weight: 500; margin: 0;">
                專業經驗
              </h2>
            </div>
          </div>

          <br><br>

          <!-- 經驗列表 -->
          <div class="space-y-4 pl-8">
            <p class="text-base text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              精誠奇唯科技公司 - 前端開發實習生
            </p>
            <p class="text-base text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              網頁前端開發設計
            </p>
            <p class="text-base text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              設計與實作 Flutter、雙平台 APP 前端開發設計
            </p>
            <p class="text-base text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              優化公司專案 UI/UX、繪製設計 Logo、Icon
            </p>
            <p class="text-base text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              西門子 UI 自動化測試工程師兼 PM
            </p>
            <p class="text-base text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              2022及2023 移動應用創新賽、SwiftUI 前端開發設計
            </p>
            <p class="text-base text-gray-600" style="font-family: 'Noto Sans TC', sans-serif;">
              NLP 結合學生程式碼懂者營運系統之分析 - 碩士論文
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import NavBar from './NavBar.vue'
</script>
