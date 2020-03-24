<template>
    <div class="body">
        <Block v-focus:navigate.right class="block"></Block>
        <Container v-focus:navigate.left class="parents">
            <Parent
                v-focus:navigate.up.down
                v-for="(item, index) in items"
                :key="index"
                :index="item"
                :blocks="getBlocks()"
            />
        </Container>
    </div>
</template>

<script>
import Block from "./Block";
import Parent from "./Parent";
import Container from "./Container"

export default {
    name: "Body",
    components: {Container, Parent, Block },
    props: {
        items: Array,
        getBlocks: Function
    },
};
</script>

<style scoped>
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
</style>
