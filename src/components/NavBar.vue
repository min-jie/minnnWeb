<template>
  <nav class="w-full text-slate-800 py-4 shadow-lg sticky top-0 z-50" style="background-color: #B9EBFF; margin: 0; padding-left: 0; padding-right: 0;">
    <div class="w-full px-4 flex justify-center items-center">
      <div class="flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200" @click="goToHome">
        <img :src="hachiImage" alt="Hachi" class="mr-3 object-contain rounded" style="width: 60px; height: 50px;" />
        <h1 class="text-2xl font-bold tracking-wide" style="font-family: 'Noto Sans TC', sans-serif; color: #397595;">Moriii Minnn</h1>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import hachiImage from '../assets/hachi.PNG?url'

const router = useRouter()

const goToHome = () => {
  router.push('/')
}
</script>
