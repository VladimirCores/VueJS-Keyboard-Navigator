<template>
    <div>
        <span>Block</span>
        <Item v-focus:navigate.up.down v-for="(item, index) in items" :key="index" :index="index"></Item>
    </div>
</template>

<script>
import Item from "./Item";
export default {
    name: "Block",
	components: { Item },
	data: () => ({
		items: [...Array((Math.ceil(Math.random() * 2) + 3)).keys()]
	})
};
</script>

<style scoped>
.item {
    display: block;
}
.item:not(:last-child) {
    margin-bottom: 1px;
}
</style>
