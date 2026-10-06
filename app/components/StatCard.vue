<script setup lang="ts">
defineProps<{ label: string; value: string; note: string; accent?: boolean }>()
</script>
<template><article class="stat" :class="{ accent }"><span>{{ label }}</span><strong>{{ value }}</strong><small>{{ note }}</small></article></template>
