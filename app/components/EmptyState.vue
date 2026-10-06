<script setup lang="ts">
import { Database } from 'lucide-vue-next'
defineProps<{ title: string; description: string }>()
</script>
<template><div class="empty"><Database :size="34" aria-hidden="true"/><h3>{{ title }}</h3><p>{{ description }}</p><slot/></div></template>
