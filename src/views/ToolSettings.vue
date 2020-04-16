<template lang="pug">
  div.settings
    v-container(fill-height)
      v-row(:justify="'center'")
        v-col(cols='10')
          h1.white--text Tool Settings
          br
          v-text-field(:messages="['Select the folder where your client.exe is.']" v-model='path' label='Game path' required color="blue lighten-2" ref="path" @click="selectFolder()")
          br
          v-btn(color='green' @click="saveTool()") Save
          v-btn.mx-3(color='red' @click="resetStage()" v-if="savedPath.length > 0") Reset Stages
          v-btn(color='red' @click="resetSongs()" v-if="savedPath.length > 0") Reset Songs
</template>

<script>
import { remote } from 'electron'
import { eventBus } from '../main.js'

export default {
  name: 'settings',
  data () {
    return {
      path: ''
    }
  },
  computed: {
    savedPath () {
      return this.$store.getters.tool.path
    },
    songs () {
      return this.$store.getters.songs
    }
  },
  methods: {
    selectFolder () {
      remote.dialog.showOpenDialog({
        properties: ['openDirectory']
      }, names => {
        if (names.length > 0) {
          let selected = names[0].replace(/\\/g, '/') + '/'
          this.path = selected
        }
      })
    },
    saveTool () {
      this.axios.post('http://localhost:1027/saveSettings', { path: this.path })
        .then((res) => {
          if (res.data.success === true) {
            this.$swal({ type: 'success', title: 'Success' })
            this.$store.commit('saveTool', { type: 'path', value: this.path })
            eventBus.$emit('init')
          } else {
            this.$swal({ type: 'error', title: 'Error', text: res.data.msg })
          }
        }).catch((err) => {
          this.$swal({ type: 'error', title: 'Error', text: err })
        })
    },
    resetStage () {
      this.$swal({ type: 'warning', title: 'Are you sure?', text: 'All stages will reset to default', showCancelButton: true })
        .then((e) => {
          if (e.value) {
            this.axios.get('http://localhost:1027/resetStage')
              .then((res) => {
                if (res.data.success === true) {
                  eventBus.$emit('init')
                  this.$swal({ type: 'success', title: 'Success' })
                } else {
                  this.$swal({ type: 'error', title: 'Error', text: res.data.msg })
                }
              })
              .catch((err) => {
                this.$swal({ type: 'error', title: 'Error', text: err })
              })
          }
        })
    },
    resetSongs () {
      this.$swal({ type: 'warning', title: 'Are you sure?', html: 'All your custom songs will be deleted. <br> All stages will reset to default.', showCancelButton: true })
        .then((e) => {
          if (e.value) {
            this.axios.get('http://localhost:1027/resetSongs')
              .then((res) => {
                if (res.data.success === true) {
                  eventBus.$emit('init')
                  this.$swal({ type: 'success', title: 'Success' })
                } else {
                  this.$swal({ type: 'error', title: 'Error', text: res.data.msg })
                }
              })
              .catch((err) => {
                this.$swal({ type: 'error', title: 'Error', text: err })
              })
          }
        })
    }
  },
  mounted () {
    this.path = this.$store.getters.tool.path
  }
}
</script>
