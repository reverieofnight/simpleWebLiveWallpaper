
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import 'virtual:svg-icons-register';
import svgIcon from '@/components/svgIcon.vue';

const app = createApp(App)

app.use(router)
app.use(createPinia())
app.component('svgIcon',svgIcon);
app.mount('#app')
