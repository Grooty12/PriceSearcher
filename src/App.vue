<script setup lang="ts">
import { useProductSearch } from './components/useProductSearch.ts'

const { query, results, isLoading, error } = useProductSearch()

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

      </div>
    </div>
  </div>
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
  border-bottom: 1px solid #eee;
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
  width: 1.0rem;
  height: 1.0rem;
  padding: 0.2rem;
}

.no-results {
  padding: 1rem;
  color: #888;
  text-align: center;
}
</style>