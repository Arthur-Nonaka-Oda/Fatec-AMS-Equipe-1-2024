import Vue from 'vue'
import App from './App.vue'
import Files from './components/Files'
import TimeLine from './components/TimeLine'

Vue.config.productionTip = false

Vue.prototype.$files = new Files();
Vue.prototype.$timeline = new TimeLine();


new Vue({
  render: h => h(App),
}).$mount('#app')
