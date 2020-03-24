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
setTimeout(() => {
  emit('ArrowDown')
  emit('ArrowRight')
  emit('ArrowUp')
  console.clear()
  emit('ArrowDown')
}, 100)

new Vue({
  render: h => h(App),
}).$mount("#app");
