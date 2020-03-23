<template>
    <div class="parent">
        <div v-if="loop">
            <Item v-focus:navigate.left.right.loop v-for="(item, index) in items" :key="index" :index="index"></Item>
            <small>loop</small>
        </div>
        <div v-else>
            <Item v-focus:navigate.left.right v-for="(item, index) in items" :key="index" :index="index"></Item>
        </div>
    </div>
</template>

<script>
import Item from "./Item";

export default {
    name: "Parent",
    props: {
      children: Array,
    },
    computed: {
        loop: () => 0 //Math.random() > 0.5,
    },
    components: { Item },
    data: () => ({
        items: [...Array((Math.ceil(Math.random() * 3) + 2)).keys()]
    })
};
</script>

<style scoped>
    .parent {
        width: 100%;
        display: block;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        background-color: whitesmoke;
    }
    .parent * :not(:last-child) {
        margin-right: 1px;
    }
    small {
        margin-left: 0.5rem;
    }
</style>
