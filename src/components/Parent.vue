<template>
    <div class="parent">
        <span class="index">{{$vnode.key}}</span>
        <div class="items" v-if="loop">
            <Item v-focus:navigate.left.right.loop v-for="(item, index) in blocks" :key="index" :index="index"></Item>
            <small>loop</small>
        </div>
        <div class="items" v-else>
            <Item v-focus:navigate.left.right v-for="(item, index) in blocks" :key="index" :index="index"></Item>
        </div>
    </div>
</template>

<script>
import Item from "./Item";

export default {
    name: "Parent",
    props: {
      blocks: Array,
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
    box-sizing: border-box;
    margin-bottom: 0.5rem;
    background-color: whitesmoke;
}
.parent * :not(:last-child) {
    margin-right: 1px;
}
.parent.selected {
    background-color: lightgreen;
}
.parent .index {
    padding: 0.25rem 0.5rem;
    margin-right: 0.5rem;
    color: black;
}

.parent .items {
    display: inline-block;
}

small {
    margin-left: 0.5rem;
}
</style>
