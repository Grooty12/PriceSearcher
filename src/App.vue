<script setup lang="ts">
import { useProductSearch } from './components/useProductSearch.ts'
import { ref, computed, onMounted, onUnmounted  } from 'vue'
import type {ProductSearchResult, Store} from "./Server/Data/searchResultInterfaces.ts";

const { query, results, isLoading, error } = useProductSearch()

interface DropDownOptions {
  label: string;
  value: string;
}

const props = defineProps<{
  options: DropDownOptions[]
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(() => {
  const match = props.options.find(o => o.value === props.modelValue)
  return match ? match.label : 'Select…'
})

function selectOption(option: DropDownOptions) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

function sortOtherStores(item) {
  const otherStores = [];
  for (const store of item.stores) {
    if (store.display_name !== item.cheapest_price_store_name) {
      otherStores.push(store);
    }
  }
  return otherStores
}

defineProps<{
  searchResults: ProductSearchResult[]
}>()

const selectedResult = ref<ProductSearchResult | null>(null)

function openOverlay(result: ProductSearchResult) {
  selectedResult.value = result
}

function closeOverlay() {
  selectedResult.value = null
}

</script>

<template>
  <div class="search">
    <input
        v-model="query"
        type="text"
        placeholder="Search for groceries..."
        class="search-bar"
    />


    <div class="results">
      <div v-if="results.length === 0" class="no-results">
        No items found.
      </div>

      <div
          v-for="item in results.results"
          :key="item.id"
          class="result-item"
          @click="openOverlay(item)"
      >
        <img class="item-image" :src=item.image_url alt="">
        <div class="item-name-and-brand">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-brand">{{ item.brand }}</span>
        </div>
        <div class="item-quantity-and-standard-price">
          <span class="item-quantity">{{ item.quantity_value + " " + item.quantity_unit}}</span>
          <span class="item-standard-price">{{item.cheapest_price_standard_quantity + " DKK / " + item.standard_quantity_unit}}</span> <!-- TODO: Maybe not hard-code DKK currency -->
        </div>
        <div class="item-cheapest-price-and-store">
          <span class="item-cheapest-price">{{item.cheapest_price + " DKK"}}</span>
          <span class="item-cheapest-store"><img class="store-image" :src=item.cheapest_price_store_favicon :alt=item.cheapest_price_store_name>{{item.cheapest_price_store_name}}</span>
        </div>
        <div class="item-other-stores">
          <img class="store-image"
               v-for="store in sortOtherStores(item)"
               :key="store.id"
               :src="store.store_favicon"
               :alt="store.display_name"
               :title="store.price + ' DKK'"
          >
      </div>
        </div>
    </div>
  </div>
  <!-- Overlay -->
  <Teleport to="body">
    <div v-if="selectedResult" class="overlay-backdrop" @click="closeOverlay">
      <div class="overlay-content" @click.stop>
        <button class="close-btn" @click="closeOverlay">×</button>
        <img class="overlay-image" :src="selectedResult.image_url" :alt="selectedResult.name">
        <h2>{{ selectedResult.name }}</h2>
        <!-- whatever detail content you want -->
      </div>
    </div>
  </Teleport>
</template>

<style scoped>

.search {
  max-width: 700px;
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
  background-color: #ffffff;
  border-bottom: 1px solid #eee;
  border-radius: 10px;
  cursor: pointer;
}

.result-item:hover {
  background-color: #eee;
}

.item-image {
  width: 5rem;
  height: 5rem;
  object-fit: contain;
  padding: 0.5rem;
}
.item-name-and-brand {
  display: flex;
  flex-direction: column;
  width: 20%;

}
.item-name {
  font-weight: bold;
  flex: 1;
  text-align: center;
}

.item-brand {
  color: #666;
  flex: 1;
  text-align: center;
}

.item-quantity {
  font-weight: bold;
  flex: 0.5;
  text-align: right;
}

.item-standard-price {
  font-weight: bold;
  flex: 0.5;
  text-align: right;
}

.item-quantity-and-standard-price {
  display: flex;
  flex-direction: column;
}

.item-cheapest-price {
  font-weight: bold;
  flex: 0.5;
  text-align: right;
}

.item-cheapest-store {
  font-weight: bold;
  flex: 0.5;
  text-align: right;
  padding: 0.2rem;
}

.item-cheapest-price-and-store {
  display: flex;
  flex-direction: column;
}

.store-image {
  width: 1.4rem;
  height: 1.4rem;
  padding: 0.5rem;
}

.item-other-stores {
  display: flex;
  flex-direction: column; /* vertical stack; use row for horizontal */
  align-items: center;
}

.no-results {
  padding: 1rem;
  color: #888;
  text-align: center;
}


.overlay-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.overlay-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}
.close-btn:hover {
  background-color: #eee;
  border-radius: 100%;
}

.overlay-image {
  width: 10rem;
  height: 10rem;
  object-fit: contain;
  padding: 0.5rem;
}

</style>