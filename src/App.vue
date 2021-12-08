<template>
  <div class="wrapper">
    <router-view v-slot="{ Component }">
      <transition>
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template> 

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  components: {},
  computed: {
    showFooter() {
      return this.$route.path.split("/").length < 3;
    },
  }
})
</script>