<template>
  <div class="min-h-screen flex flex-col w-full bg-slate-50 m-0 p-0">
    <NavBar />
    <main class="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center w-full">
      <!-- 歡迎文字 -->
      <h1 class="text-xl leading-relaxed text-gray-500 font-['Noto_Sans_TC'] mb-24">
        大家好，歡迎來到 Moriii 的網站~
      </h1>
      
      <!-- 角色圖片容器 -->
      <div class="p-2 rounded-lg bg-sky-100 mb-10">
        <img src="/character.png" alt="Moriii Character" class="object-contain w-[270px] h-[270px]" />
      </div>
      
      <!-- 按鈕組 -->
      <div class="space-y-6 flex flex-col items-center">
        <!-- 關於我按鈕 -->
        <button 
          @click="goToAbout"
          class="text-white font-bold py-6 px-12 rounded-full 
                 transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-md 
                 flex items-center justify-between w-80 text-lg font-['Noto_Sans_TC'] border-none hover:opacity-90"
          style="background-color: #52ACD0;"
        >
          <span class="flex-1 text-center">關於我</span>
          <svg 
            width="24" 
            height="24" 
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
        
        <!-- 我的履歷按鈕 -->
        <button 
          @click="openResume"
          class="text-white font-bold py-6 px-12 rounded-full 
                 transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-md 
                 flex items-center justify-center w-80 text-lg font-['Noto_Sans_TC'] border-none hover:opacity-90"
          style="background-color: #52ACD0;"
        >
          我的履歷
        </button>
        
        <!-- 我的作品集按鈕 -->
        <button 
          @click="openPortfolio"
          class="text-white font-bold py-6 px-12 rounded-full 
                 transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-md 
                 flex items-center justify-center w-80 text-lg font-['Noto_Sans_TC'] border-none hover:opacity-90"
          style="background-color: #52ACD0;"
        >
          我的作品集
        </button>
      </div>
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

const openResume = () => {
  window.open('/resume.pdf', '_blank')
}

const openPortfolio = () => {
  window.open('/portfolio.pdf', '_blank')
}
</script>
