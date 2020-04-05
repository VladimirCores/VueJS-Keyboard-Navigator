<template>
  <div id="app">
    <Item class="special" v-selected v-focus:navigate.down :index="111"/>
    <Body v-focus:navigate.up.down :items="items" :getBlocks="getRandomBlockAmount"/>
    <div class="body">
      <Block v-focus:navigate.up.right class="block"></Block>
      <Container v-focus:navigate.left.right class="container">
        <Parent
          v-focus:navigate.up.down
          v-for="(item, index) in items"
          :key="index"
          :blocks="getRandomBlockAmount()"
          :index="item"
        />
      </Container>
    </div>
  </div>
</template>

<script>
  import Parent from "./components/Parent";
  import Block from "./components/Block";
  import Item from "./components/Item";
  import Navigator from "./navigator";
  import Body from "./components/Body"
  import Container from "./components/Container"

  export default {
    name: "App",
    props: { children: Array },
    components: {Container, Body, Parent, Block, Item },
    data: () => ({
      items: [...Array(4).keys()]
    }),
    methods: {
      getRandomBlockAmount: () => {
        return [...Array((Math.ceil(Math.random() * 8) + 1)).keys()]
      }
    },
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
.body.selected {
  border: 1px solid red;
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
.container {
  position: relative;
  vertical-align:top;
  display: inline-block;
}

.container.selected {
  border: green;
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
