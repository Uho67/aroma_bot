<template>
  <div class="buttons-view">
    <ButtonManager />
  </div>
</template>

<script>
import ButtonManager from '../components/ButtonManager.vue'

export default {
  name: 'ButtonsView',
  components: {
    ButtonManager
  }
}
</script>

<style scoped>
.buttons-view {
  padding: 20px;
}
</style> 