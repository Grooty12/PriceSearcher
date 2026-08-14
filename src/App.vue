<script setup>
import { ref, computed } from 'vue'

const results = ref([])
const searchQuery = ref('')


async function search() {
  const res = await fetch(`http://localhost:3001/api/ProductsName/${searchQuery.value}`)
  results.value = await res.json()
}

</script>

<template>
  <div class="search-container">
    <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for groceries..."
        class="search-bar"
        @keyup.enter="search"
    />


    <div class="results">
      <div v-if="results.length === 0" class="no-results">
        No items found.
      </div>

      <div
          v-for="item in results.results"
          :key="item.id"
          class="result-item"
      >
        <span class="item-name">{{ item.name }}</span>
        <span class="item-brand">{{ item.brand }}</span>
        <span class="item-quantity">{{ item.quantity_value + " " + item.quantity_unit}}</span>
      </div>
    </div>
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

.results {
  margin-top: 1rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.item-name {
  font-weight: bold;
  flex: 1;
}

.item-brand {
  color: #666;
  flex: 1;
  text-align: center;
}

.item-quantity {
  color: #2c7a2c;
  font-weight: bold;
  flex: 0.5;
  text-align: right;
}

.no-results {
  padding: 1rem;
  color: #888;
  text-align: center;
}
</style>