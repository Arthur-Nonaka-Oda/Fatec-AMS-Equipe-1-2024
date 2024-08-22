import Vue from 'vue'
import App from './App.vue'
import Files from './models/Files'

Vue.config.productionTip = false

Vue.prototype.$files = new Files();


new Vue({
  render: h => h(App),
}).$mount('#app')
