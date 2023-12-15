<template>
  <div class="greeting">Hello, this is {{ name }}.</div>
</template>

<script setup>
import { defineProps } from 'vue';
defineProps({
  name: {
    type: String,
    required: true,
  },
});
</script>

<style>
.greeting {
  display: flex;
  justify-content: center;
}
</style>
