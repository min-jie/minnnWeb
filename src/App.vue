<script setup lang="ts">
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: #F8FAFC;">
    <NavBar />
    <main class="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
      <!-- 歡迎文字 -->
      <h1 class="text-xl mb-12 leading-relaxed" style="color: #6B7280; font-family: 'Noto Sans TC', sans-serif;">
        大家好，歡迎來到 Moriii 的網站~
      </h1>
      
      <!-- 角色圖片容器 -->
      <div class="p-4 rounded-lg" style="background-color: #E0F2FE; margin-bottom: 30px;">
        <img src="/character.png" alt="Moriii Character" class="object-contain" style="width: 200px; height: 200px;" />
      </div>
      
      <!-- 關於我按鈕 -->
      <button 
        class="px-24 py-10 rounded-full font-bold text-lg transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-md border-0 flex items-center gap-3"
        style="background-color: #52ACD0; color: white; font-family: 'Noto Sans TC', sans-serif; border: none;"
      >
        關於我
        <svg 
          width="50" 
          height="40" 
          viewBox="0 0 14 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          class="transition-transform duration-200"
        >
          <path 
            d="M13.5 8.5L17 12L13.5 15.5M17 12H7" 
            stroke="white" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </main>
  </div>
</template>


