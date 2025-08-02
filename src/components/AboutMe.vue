<template>
  <div class="min-h-screen flex flex-col w-full" style="background-color: #F8FAFC; margin: 0; padding: 0;">
    <NavBar />
    <main class="flex-1 py-16 px-8 w-full">
      <div class="max-w-4xl mx-auto">
        <!-- 標題 -->
        <h1 class="text-3xl font-bold mb-8" style="color: #6B7280; font-family: 'Noto Sans TC', sans-serif;">
          大家好，這裡是 Minnn~
        </h1>
        
        <!-- 基本資訊 -->
        <div class="mb-8">
          <div class="flex items-center mb-4">
            <span class="inline-block w-4 h-4 bg-gray-400 rounded mr-3"></span>
            <span style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">台灣 高雄市</span>
          </div>
          <div class="flex items-center mb-4">
            <span class="inline-block w-4 h-4 bg-gray-400 rounded mr-3"></span>
            <span style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">逢甲大學資訊工程碩士</span>
          </div>
          <div class="flex items-center mb-4">
            <span class="inline-block w-4 h-4 bg-gray-400 rounded mr-3"></span>
            <span style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">我的履歷</span>
          </div>
        </div>

        <!-- 專業經驗 -->
        <div class="mb-8">
          <h2 class="text-xl font-bold mb-4" style="color: #6B7280; font-family: 'Noto Sans TC', sans-serif;">專業經驗</h2>
          
          <div class="mb-6 p-6 bg-white rounded-lg shadow-sm">
            <p class="mb-4" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
              今年2025年8月份從逢甲大學資訊工程研究所的軟體工程實驗室畢業
            </p>
            <p class="mb-4" style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
              專業領域為軟體開發、前端設計，以及UI/UX設計，平時也喜愛繪畫及創作，論文研究向為 NLP 相關結合學生程式碼懂者
            </p>
            
            <button class="px-6 py-3 rounded-full text-white font-bold mb-6" style="background-color: #7DD3FC; font-family: 'Noto Sans TC', sans-serif;">
              專業經驗
            </button>
          </div>

          <div class="space-y-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
              <p style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
                精誠奇唯科技公司 - 前端開發實習生
              </p>
            </div>
            
            <div class="p-4 bg-white rounded-lg shadow-sm">
              <p style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
                網頁前端開發設計
              </p>
            </div>
            
            <div class="p-4 bg-white rounded-lg shadow-sm">
              <p style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
                設計與實作 Flutter、雙平台 APP 前端開發設計
              </p>
            </div>
            
            <div class="p-4 bg-white rounded-lg shadow-sm">
              <p style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
                優化公司專案 UI/UX、繪製設計 Logo、Icon
              </p>
            </div>
            
            <div class="p-4 bg-white rounded-lg shadow-sm">
              <p style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
                西門子 UI 自動化測試工程師兼 PM
              </p>
            </div>
            
            <div class="p-4 bg-white rounded-lg shadow-sm">
              <p style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
                2022及2023 移動應用創新賽、SwiftUI 前端開發設計
              </p>
            </div>
            
            <div class="p-4 bg-white rounded-lg shadow-sm">
              <p style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
                NLP 結合學生程式碼懂者營運系統之分析 - 碩士論文
              </p>
            </div>
          </div>
        </div>

        <!-- 聯絡資訊 -->
        <div class="mb-8">
          <button class="px-6 py-3 rounded-full text-white font-bold mb-6" style="background-color: #7DD3FC; font-family: 'Noto Sans TC', sans-serif;">
            相關連結
          </button>
          <p style="font-family: 'Noto Sans TC', sans-serif; color: #6B7280;">
            Mail Github Linkin IG
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import NavBar from './NavBar.vue'
</script>
