<template lang="pug">
  div.settings
    v-container(fill-height v-if="songs.length > 0")
      v-row(:justify="'center'")
        v-col(cols='10' v-if="songs.length > 0")
          v-alert(type='error') Only works when you have mod patch installed.
          h1.white--text Note Settings
          br
          h2 Note
          v-row
            v-col(v-for="(note, idx) in notes" :key="idx" col="4" sm="3" md="2" lg="1" style="flex-grow: 0")
              .note(:class="{selected: idx === selected.note}")
                v-img(:src="`./notes/${idx}.png`" @click="select('note', idx)")
          br
          hr
          br
          h2 Coolbomb
          v-row
            v-col(v-for="(note, idx) in notes" :key="idx" col="4" sm="3" md="2" lg="1" v-if="idx !== 9 && idx !== 10 && idx !== 13" style="flex-grow: 0")
              .note(:class="{selected: idx === selected.bomb}")
                v-img(:src="`./notes/${idx}.png`" @click="select('bomb', idx)")
          br
          hr
          br
          v-btn(color='green' @click="saveNote()") Save
    v-container(fill-height v-else)
      v-row(:justify="'center'")
        v-col(cols="10")
          h1.white--text Note Settings
          hr
          br
          p Please set your game path in tool settings page first.
</template>

<script>
export default {
  name: 'settings',
  data () {
    return {
      notes: [
        'Technika3 (Default) Note',
        'Rainbow Note',
        'Speaker Note',
        'Radar Note',
        'LED Note',
        'Mirror Note',
        'Crystal Note',
        'Envy Ranger Note',
        'Son of Sun Note',
        'Black Note',
        'Technika2 (Classic) Note',
        'Hexagon Note',
        'Animal Note',
        'Technicolor Note'
      ]
    }
  },
  computed: {
    songs () {
      return this.$store.getters.songs
    },
    selected: {
      get () {
        return this.$store.getters.note
      }
    }
  },
  methods: {
    select (type, id) {
      switch (type) {
        case 'note':
          this.selected.note = id
          break
        case 'bomb':
          this.selected.bomb = id
          break
      }
    },
    saveNote () {
      this.axios.post('http://localhost:1027/note', { note: this.selected })
        .then((res) => {
          if (res.data.success === true) {
            this.$swal({ type: 'success', title: 'Success' })
            this.$store.commit('initNote', this.selected)
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
