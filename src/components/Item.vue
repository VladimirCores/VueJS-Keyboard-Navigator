<template>
    <div class="item">
        <span>{{this.$el ? this.$el.id : this.index}}</span>
    </div>
</template>

<script>
export default {
    name: "Item",
    props: {
        index: Number,
        children: Array
    },
    computed: {

    },
    data: () => ({

    })
};
</script>

<style scoped>
.item {
    padding: 0.5rem 1rem;
    text-align: center;
    background-color: deepskyblue;
    color: white;
    font-weight: bold;
    display: inline-block;
}
</style>
