<template>
  <div id="app">
    <Item class="special" v-selected v-focus:navigate.down :index="111"/>
    <Body v-focus :items="items"/>
    <div class="body">
      <Block v-focus:navigate.up.right class="block"></Block>
      <div class="parents">
        <Parent
          v-focus:navigate.up.down.left
          v-for="(item, index) in items"
          :key="index"
          :index="item"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import Parent from "./components/Parent";
  import Block from "./components/Block";
  import Item from "./components/Item";
  import Navigator from "./navigator";
  import Body from "./components/Body"

  export default {
    name: "App",
    props: { children: Array },
    components: {Body, Parent, Block, Item },
    data: () => ({
      items: [...Array(3).keys()]
    }),
    beforeCreate() {
      Navigator.init()
    }
  };
</script>

<style scoped>
  .special {
    width: 100%;
    display: block;
  }
  .body {
    margin-top: 1rem;
    box-sizing: border-box;
    position: relative;
  }
  .block {
    position: relative;
    padding: 0.5rem;
    margin-right: 1rem;
    text-align: center;
    background-color: whitesmoke;
    font-weight: bold;
    display: inline-block;
    vertical-align: top;
  }
  .parents {
    position: relative;
    vertical-align:top;
    display: inline-block;
  }
  #app {
    margin: 21px;
    text-align: left;
    padding: 0;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }
</style>
