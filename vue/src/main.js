import Vue from 'vue'
import App from './App.vue'
import Files from './models/Files'
import { createPinia, PiniaVuePlugin } from 'pinia'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUser, faLock, faAngleUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Adiciona os ícones à biblioteca
library.add(faUser, faLock, faAngleUp)

// Instala o plugin Pinia
Vue.use(PiniaVuePlugin)

// Cria a instância do Pinia
const pinia = createPinia()

// Registra o componente FontAwesome globalmente
Vue.component('font-awesome-icon', FontAwesomeIcon)

// Adiciona Files como propriedade global
Vue.prototype.$files = new Files()

// Cria a instância do Vue
new Vue({
  pinia,
  render: h => h(App)
}).$mount('#app')
