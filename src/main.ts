import { createApp } from 'vue'
// @ts-ignore
import { createPinia } from 'pinia'


// @ts-ignore
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
