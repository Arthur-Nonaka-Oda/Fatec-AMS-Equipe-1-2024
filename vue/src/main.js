import Vue from 'vue'
import App from './App.vue'
import Files from './models/Files'

// Adiciona Files globalmente
Vue.prototype.$files = new Files()

Vue.config.productionTip = false

// Unicons

import Unicon from 'vue-unicons/dist/vue-unicons-vue2.umd'
import { uniAngleUp } from 'vue-unicons/dist/icons'

Unicon.add([uniAngleUp])
Vue.use(Unicon)

new Vue({
  render: h => h(App)
}).$mount('#app')


