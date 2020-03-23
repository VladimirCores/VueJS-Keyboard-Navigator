<template>
    <div class="body">
        <Block v-focus:navigate.right class="block"></Block>
        <div class="parents">
            <Parent
                v-focus:navigate.up.down.left
                v-for="(item, index) in items"
                :key="index"
                :index="item"
            />
        </div>
    </div>
</template>

<script>
import Block from "./Block";
import Parent from "./Parent";

export default {
    name: "Body",
    components: { Parent, Block },
    props: {
        items: Array
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
