<template>
  <div class="posts-view">
    <PostManager />
  </div>
</template>

<script>
import PostManager from '../components/PostManager.vue'

export default {
  name: 'PostsView',
  components: {
    PostManager
  }
}
</script>

<style scoped>
.posts-view {
  padding: 20px;
}
</style> 