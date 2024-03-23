<template>
  <div class="greeting">Hello, this is {{ name }}.</div>
</template>

<script setup>
import { defineProps, onMounted } from 'vue';
import { test } from '../common';
import '../common.css';
defineProps({
  name: {
    type: String,
    required: true,
  },
});
onMounted(test)
</script>

<style>
.greeting {
  display: flex;
  justify-content: center;
  color: red;
}
</style>
