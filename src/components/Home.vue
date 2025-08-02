<template>
  <div class="min-h-screen flex flex-col w-full" style="background-color: #F8FAFC; margin: 0; padding: 0;">
    <NavBar />
    <main class="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center w-full">
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
        @click="goToAbout"
        class="px-16 py-6 rounded-full font-bold text-lg transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-md border-0 flex items-center gap-3"
        style="background-color: #52ACD0; color: white; font-family: 'Noto Sans TC', sans-serif; border: none;"
      >
        關於我
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
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

<script setup lang="ts">
import { useRouter } from 'vue-router'
import NavBar from './NavBar.vue'

const router = useRouter()

const goToAbout = () => {
  router.push('/about')
}
</script>
