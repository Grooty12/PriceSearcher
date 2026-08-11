<script setup>
import { ref, computed } from 'vue'


const searchQuery = ref('')

</script>

<template>
  <div class="search-container">
    <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for groceries..."
        class="search-bar"
    />

  </div>
</template>

<style scoped>
.search-container {
  max-width: 500px;
  margin: 2rem auto;
  font-family: sans-serif;
}

.search-bar {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}
</style>