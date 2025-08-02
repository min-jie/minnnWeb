<template>
  <div class="min-h-screen w-full" style="background: linear-gradient(135deg, #E8F4F8 0%, #D6EDF6 100%); margin: 0; padding: 0;">
    <NavBar />
    <main class="px-8 py-12 w-full">
      <div class="max-w-4xl mx-auto">
        
        <!-- 主要內容卡片 -->
        <div class="bg-white rounded-3xl p-8 mb-8" style="border: 3px solid #5A9FD4;">
          <!-- 標題 -->
          <h1 class="text-2xl font-medium mb-6" style="color: #5A9FD4; font-family: 'Noto Sans TC', sans-serif;">
            大家好，這裡是 Minnn-
          </h1>
          
          <!-- 基本資訊 -->
          <div class="space-y-3 mb-6">
            <div class="flex items-center">
              <span class="inline-block w-2 h-2 bg-gray-400 rounded-full mr-4"></span>
              <span style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280; font-size: 16px;">台灣 高雄市</span>
            </div>
            <div class="flex items-center">
              <span class="inline-block w-2 h-2 bg-gray-400 rounded-full mr-4"></span>
              <span style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280; font-size: 16px;">逢甲大學資訊工程碩士</span>
            </div>
            <div class="flex items-center">
              <span class="inline-block w-2 h-2 bg-gray-400 rounded-full mr-4"></span>
              <span style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280; font-size: 16px;">我的履歷</span>
            </div>
          </div>

          <!-- 關於我內容 -->
          <div class="space-y-4">
            <p class="text-base leading-relaxed" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
              今年2025年8月份從逢甲大學資訊工程研究所的軟體工程實驗室畢業
            </p>
            <p class="text-base leading-relaxed" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
              專業領域為軟體開發、前端設計，以及UI/UX設計，平時也喜愛繪畫及創作，論文研究向為 NLP 相關結合學生程式碼評論品質分析
            </p>
          </div>
        </div>

        <!-- 專業經驗按鈕 -->
        <div class="mb-6">
          <button class="px-6 py-3 rounded-full text-white font-medium" style="background-color: #5A9FD4; font-family: 'Noto Sans TC', sans-serif; border: none; font-size: 16px;">
            專業經驗
          </button>
        </div>

        <!-- 經驗列表 -->
        <div class="space-y-4 mb-12">
          <p class="text-base" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
            精誠奇唯科技公司 - 前端開發實習生
          </p>
          <p class="text-base" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
            網頁前端開發設計
          </p>
          <p class="text-base" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
            設計與實作 Flutter、雙平台 APP 前端開發設計
          </p>
          <p class="text-base" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
            優化公司專案 UI/UX、繪製設計 Logo、Icon
          </p>
          <p class="text-base" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
            西門子 UI 自動化測試工程師兼 PM
          </p>
          <p class="text-base" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
            2022及2023 移動應用創新賽、SwiftUI 前端開發設計
          </p>
          <p class="text-base" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
            NLP 結合學生程式碼懂者營運系統之分析 - 碩士論文
          </p>
        </div>

        <!-- 聯絡資訊按鈕 -->
        <div class="flex flex-wrap gap-4 justify-center">
          <button class="px-6 py-2 rounded text-gray-500 text-sm font-medium" style="background-color: #F3F4F6; font-family: 'Noto Sans TC', sans-serif; border: none;">
            Mail
          </button>
          <button class="px-6 py-2 rounded text-gray-500 text-sm font-medium" style="background-color: #F3F4F6; font-family: 'Noto Sans TC', sans-serif; border: none;">
            Github
          </button>
          <button class="px-6 py-2 rounded text-gray-500 text-sm font-medium" style="background-color: #F3F4F6; font-family: 'Noto Sans TC', sans-serif; border: none;">
            Linkin
          </button>
          <button class="px-6 py-2 rounded text-gray-500 text-sm font-medium" style="background-color: #F3F4F6; font-family: 'Noto Sans TC', sans-serif; border: none;">
            IG
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import NavBar from './NavBar.vue'
</script>
