import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type {ProductSearchResult} from "../Server/Data/database.ts";

export function useProductSearch() {
    const query = ref('')
    const results = ref<ProductSearchResult[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const search = useDebounceFn(async (q: string) => {
        if (!q.trim()) {
            results.value = []
            return
        }
        isLoading.value = true
        error.value = null
        try {
            const res = await fetch(`http://localhost:3001/api/products/byName/search?q=${encodeURIComponent(q)}`)
            if (!res.ok) throw new Error('Search failed')
            results.value = await res.json()
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Unknown error'
        } finally {
            isLoading.value = false
        }
    }, 300) // 300ms debounce

    watch(query, (newQuery) => search(newQuery))

    return { query, results, isLoading, error }
}