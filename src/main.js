import { installDevMocks } from './lib/devmock'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/base.css'

installDevMocks()

createApp(App).mount('#app')
