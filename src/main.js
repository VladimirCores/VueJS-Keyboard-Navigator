import Vue from "vue";
import App from "./App.vue";
import Navigator from "./navigator";

Vue.config.productionTip = false;

Vue.use(Navigator);

const emit = (up) => {
  let e = new KeyboardEvent('keyup', {key: up ? 'ArrowUp':'ArrowDown'})
  window.dispatchEvent(e)
}

// setTimeout(() => {
//   emit(true)
// }, 1000)

new Vue({
  render: h => h(App),
  // mounted: emit
}).$mount("#app");
