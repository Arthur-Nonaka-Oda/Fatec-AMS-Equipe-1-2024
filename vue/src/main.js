import Vue from 'vue'
import App from './App.vue'
import Files from './models/Files'

Vue.config.productionTip = false

Vue.prototype.$files = new Files();

import { library } from '@fortawesome/fontawesome-svg-core'
// Ícones que você quer usar
import { faUser, faLock, faAngleUp } from '@fortawesome/free-solid-svg-icons'
// Componente do Vue
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Adiciona os ícones à biblioteca
library.add(faUser, faLock, faAngleUp)

// Registra o componente globalmente
Vue.component('font-awesome-icon', FontAwesomeIcon)


new Vue({
  render: h => h(App),
}).$mount('#app')
