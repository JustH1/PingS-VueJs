<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import AppToast from '@/components/shared/AppToast.vue'

const auth = useAuthStore()

onMounted(async () => {
  await auth.initFromStorage()
})
</script>

<template>
  <RouterView />
  <AppToast />
</template>
