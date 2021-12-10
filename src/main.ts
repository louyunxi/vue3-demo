import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/css/base.css'
import './assets/css/main.styl'
import BaseComponents from './components/base'
import BaseDirective from './directive'
import { axiosPlugin } from './http/axiosPlugin';

const app = createApp(App)

app.use(BaseComponents)
app.use(BaseDirective)

app.use(store).use(router).use(axiosPlugin).mount('#app')
