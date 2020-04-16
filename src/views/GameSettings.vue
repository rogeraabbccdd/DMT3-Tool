<template lang="pug">
  div.settings
    v-container(fill-height v-if="songs.length > 0")
      v-row(:justify="'center'")
        v-col(cols='10' v-if="songs.length > 0")
          h1.white--text Game Settings
          br
          v-row(justify="space-around")
            v-switch.ma-2(v-model='game.dev_mode' label='Show FPS')
            v-switch.ma-2(v-model='game.fullscreen' label='Fullscreen')
            v-switch.ma-2(v-model='game.show_cursor' label='Show cursor')
            v-switch.ma-2(v-model='game.vsync' label='VSync')
          v-subheader.pl-0 Key sound volume
          v-slider(v-model.number="game.sfx_volume" thumb-label="always" min="0" max="127")
          v-subheader.pl-0 BGM volume
          v-slider(v-model.number="game.bgm_volume" thumb-label="always" min="0" max="127")
          v-btn(color='green' @click="saveGame()") Save
    v-container(fill-height v-else)
      v-row(:justify="'center'")
        v-col(cols="10")
          h1.white--text Game Settings
          hr
          br
          p Please set your game path in tool settings page first.
</template>

<script>
export default {
  name: 'settings',
  computed: {
    songs () {
      return this.$store.getters.songs
    },
    game: {
      get () {
        return this.$store.getters.settings
      }
    }
  },
  methods: {
    saveGame () {
      this.axios.post('http://localhost:1027/saveGame', this.game)
        .then((res) => {
          if (res.data.success === true) {
            this.$swal({ type: 'success', title: 'Success' })
            this.$store.commit('initSettings', this.game)
          } else {
            this.$swal({ type: 'error', title: 'Error', text: res.data.msg })
          }
        }).catch((err) => {
          this.$swal({ type: 'error', title: 'Error', text: err })
        })
    }
  }
}
</script>
