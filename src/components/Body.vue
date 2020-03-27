<template>
    <div class="body">
        <Block v-focus:navigate.right.keepid class="block"></Block>
        <Container v-focus:navigate.left.right class="parents">
            <span><b>Container</b></span>
            <Parent
                v-focus:navigate.up.down.keepid
                v-for="(item, index) in items"
                :key="index"
                :index="item"
                :blocks="getBlocks()"
            />
        </Container>
        <Block v-focus:navigate.left.right class="block"></Block>
        <Block v-focus:navigate.left class="block"></Block>
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
    text-align: center;
    background-color: whitesmoke;
    display: inline-block;
    vertical-align: top;
}
.block:last-child {
    margin-left: 1rem;
}
.parents {
    position: relative;
    vertical-align:top;
    margin: 0 1rem;
    display: inline-block;
}
</style>
