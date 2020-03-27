import Vue from "vue";
import App from "./App.vue";
import Navigator from "./navigator";

Vue.config.productionTip = false;

Vue.use(Navigator);

const delay = time => new Promise(r => setTimeout(r, time))
const emit = (event) => {
  let e = new KeyboardEvent('keyup', {key: event})
  window.dispatchEvent(e)
}
/*
* Cases:
* 1. ['ArrowDown', 'ArrowRight', 'ArrowUp']
* 2. ['ArrowDown', 'ArrowRight', 'ArrowLeft']
* */

new Vue({
  render: h => h(App),
  mounted() {
    emit('ArrowDown')
    emit('ArrowRight')
    emit('ArrowRight')
    emit('ArrowUp')
    emit('ArrowDown')
    emit('ArrowLeft')
    emit('ArrowLeft')
    emit('ArrowUp')
    console.clear()
  }
}).$mount("#app");
