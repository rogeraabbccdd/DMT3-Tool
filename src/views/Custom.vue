<template lang="pug">
  div.home
    v-container(fill-height v-if="customSongs.length > 0")
      v-row(:justify="'center'")
        v-col(cols="10")
          h1.white--text Custom Songs
          hr
          v-row
            v-col(cols="12")
              v-text-field(placeholder="Type to search..." prepend-icon="search" v-model="search")
          v-row.cards
            v-col(cols='4' v-for="(s, idx) in filteredSongs" :key="idx")
              v-card
                v-img.white--text.align-end(height='200px' :src="'http://localhost:1027/customImg?name=' + s['name']")
                v-card-title {{ s['FullName'] }}
                v-card-text.text--primary
                  div(v-if="s['Star_1'] > 0 || s['Star_2'] > 0 || s['Star_3'] > 0 || s['Star_4'] > 0") STAR MIXING
                  div
                    span.yellow--text.lighten-1(v-if="s['Star_1'] > 0") NM {{ s['Star_1'] }}
                    span(v-if="s['Star_2'] > 0") &emsp;/&emsp;
                    span.blue--text(v-if="s['Star_2'] > 0") HD {{ s['Star_2'] }}
                    span(v-if="s['Star_3'] > 0") &emsp;/&emsp;
                    span.red--text(v-if="s['Star_3'] > 0") MX {{ s['Star_3'] }}
                    span(v-if="s['Star_4'] > 0") &emsp;/&emsp;
                    span.purple--text.text--lighten-3(v-if="s['Star_4'] > 0") EX {{ s['Star_4'] }}
                  br
                  div POP MIXING
                  div
                    span.yellow--text.lighten-1 NM {{ s['Pop_1'] }}
                    span(v-if="s['Pop_2'] > 0") &emsp;/&emsp;
                    span.blue--text(v-if="s['Pop_2'] > 0") HD {{ s['Pop_2'] }}
                    span(v-if="s['Pop_3'] > 0") &emsp;/&emsp;
                    span.red--text(v-if="s['Pop_3'] > 0") MX {{ s['Pop_3'] }}
                    span(v-if="s['Pop_4'] > 0") &emsp;/&emsp;
                    span.purple--text.text--lighten-3(v-if="s['Pop_4'] > 0") EX {{ s['Pop_4'] }}
                br
                v-btn.btn-edit(absolute icon dark fab bottom right color='green' @click="edit(s)")
                  v-icon edit
                v-btn.btn-del(absolute icon dark fab bottom right color='red' @click="del(s)")
                  v-icon delete
    v-container(fill-height v-else)
      v-row(:justify="'center'")
        v-col(cols="10")
          h1.white--text Custom Songs
          hr
          br
          p Can't find any custom songs.
    v-btn.btn-add(fixed dark fab bottom right color='pink' @click="initDialog()")
      v-icon mdi-plus
    v-dialog(v-model='dialog.show' width='500')
      v-form(ref='form' v-model='dialog.valid')
        v-card
          v-card-title.headline.blue.darken-2(primary-title) {{ dialog.mode ==='add' ? 'Add new' : 'Edit'}} song
          v-card-text
            v-container
              v-row
                v-col(cols="12")
                  v-alert(type='error') Make sure you have installed all needed files.
                  v-text-field(v-model='dialog.name' label='Song ID' :messages="['A short text without space of song name, e.g. rayof, cypher']" :rules="[v => !!v || 'Required']")
                  br
                  v-text-field(v-model='dialog.FullName' label='Song fullname' :messages="['Fullname of song']" :rules="[v => !!v || 'Required']")
                  br
                  v-text-field(v-model='dialog.Genre' label='Genre' :messages="['Genre of song, e.g. trance, dubstep']" :rules="[v => !!v || 'Required']")
                  br
                  v-text-field(v-model='dialog.Composer' label='Composer' :messages="['Composer of song, e.g. M2U, XeoN']" :rules="[v => !!v || 'Required']")
                  br
                  v-text-field(v-model='dialog.Movie' label='BGA movie folder' :messages="[`BGA movie folder number, input 20 if your BGA is in movie20 folder.`]" type='number' min="1" :rules="rules(1)")
                  br
                  v-switch(v-model='dialog.loopBga' label='Loop BGA')
                  br
                  v-text-field(v-model='dialog.Star_1' label='STAR NM difficulty' :messages="[`0 if doesn't exist`]" type='number' min="0" :rules="rules(0)")
                  br
                  v-text-field(v-model='dialog.Star_2' label='STAR HD difficulty' :messages="[`0 if doesn't exist`]" type='number' min="0" :rules="rules(0)")
                  br
                  v-text-field(v-model='dialog.Star_3' label='STAR MX difficulty' :messages="[`0 if doesn't exist`]" type='number' min="0" :rules="rules(0)")
                  br
                  v-text-field(v-model='dialog.Star_4' label='STAR EX difficulty' :messages="[`0 if doesn't exist`]" type='number' min="0" :rules="rules(0)")
                  br
                  v-text-field(v-model='dialog.Pop_1' label='POP NM difficulty' :messages="[`0 if doesn't exist`]" type='number' min="0" :rules="rules(0)")
                  br
                  v-text-field(v-model='dialog.Pop_2' label='POP HD difficulty' :messages="[`0 if doesn't exist`]" type='number' min="0" :rules="rules(0)")
                  br
                  v-text-field(v-model='dialog.Pop_3' label='POP MX difficulty' :messages="[`0 if doesn't exist`]" type='number' min="0" :rules="rules(0)")
                  br
                  v-text-field(v-model='dialog.Pop_4' label='POP EX difficulty' :messages="[`0 if doesn't exist`]" type='number' min="0" :rules="rules(0)")
          v-divider
          v-card-actions
            v-spacer
            v-btn(color='red' text @click="dialog.show = false") Cancel
            v-btn(color='green darken-1' text @click='addSong()') Save
</template>

<script>
import { eventBus } from '../main.js'
import { shell } from 'electron'

export default {
  name: 'home',
  data () {
    return {
      search: '',
      dialog: {
        mode: 'add',
        songNo: 0,
        valid: true,
        show: false,
        name: '',
        FullName: '',
        Genre: '',
        Composer: '',
        Movie: 20,
        loopBga: 0,
        Star_1: 0,
        Star_2: 0,
        Star_3: 0,
        Star_4: 0,
        Pop_1: 0,
        Pop_2: 0,
        Pop_3: 0,
        Pop_4: 0
      }
    }
  },
  computed: {
    songs () {
      return this.$store.getters.songs
    },
    customSongs () {
      return this.$store.getters.songs.filter((s) => {
        const no = parseInt(s['no'])
        return no >= 184 || no === 88 || no === 178
      })
    },
    filteredSongs () {
      return this.customSongs.filter((song) => {
        return song.FullName.toUpperCase().includes(this.search.toUpperCase())
      })
    }
  },
  methods: {
    rules (num) {
      return [
        v => !!v || 'Required',
        v => parseInt(v) >= num || `Minimum is ${num}`
      ]
    },
    isLong (s) {
      const no = parseInt(s['no'])
      return (no <= 183 && s['name'].includes('long'))
    },
    openExternal (url) {
      shell.openExternal(url)
    },
    addSong () {
      if (this.$refs.form.validate()) {
        this.axios.post('http://localhost:1027/custom', this.dialog).then((res) => {
          if (res.data.success === true) {
            this.$swal({ type: 'success', title: 'Success' })
            eventBus.$emit('init')
          } else {
            this.$swal({ type: 'error', title: 'Error', text: res.data.msg })
          }
        }).catch((err) => {
          this.$swal({ type: 'error', title: 'Error', text: err })
        })
      }
    },
    edit (song) {
      const loop = song.loopBga === 'FALSE' ? 0 : 1
      this.dialog = {
        mode: 'edit',
        songNo: song.no,
        valid: true,
        show: true,
        name: song.name,
        FullName: song.FullName,
        Genre: song.Genre,
        Composer: song.Composer,
        Movie: parseInt(song.bg_folder.replace(/movie/g, '')),
        loopBga: loop,
        Star_1: song.Star_1,
        Star_2: song.Star_2,
        Star_3: song.Star_3,
        Star_4: song.Star_4,
        Pop_1: song.Pop_1,
        Pop_2: song.Pop_2,
        Pop_3: song.Pop_3,
        Pop_4: song.Pop_4
      }
    },
    initDialog () {
      let no = -1
      if (this.songs.filter(song => parseInt(song.no) === 88).length === 0) no = 88
      else if (this.songs.filter(song => parseInt(song.no) === 178).length === 0) no = 178
      else no = this.songs[this.songs.length - 1].no + 1

      if (no > 199) this.$swal({ type: 'error', title: 'Error', text: 'Discstock is full!' })
      else {
        this.dialog = {
          mode: 'add',
          songNo: no,
          show: true,
          name: '',
          FullName: '',
          Genre: '',
          Composer: '',
          Movie: 20,
          loopBga: 0,
          Star_1: 0,
          Star_2: 0,
          Star_3: 0,
          Star_4: 0,
          Pop_1: 0,
          Pop_2: 0,
          Pop_3: 0,
          Pop_4: 0
        }
      }
    },
    del (song) {
      this.$swal({ type: 'warning', title: 'Are you sure?', text: 'All stage slots with this song will reset to default', showCancelButton: true })
        .then((e) => {
          if (e.value) {
            this.axios.post('http://localhost:1027/del', { songNo: song.no })
              .then((res) => {
                if (res.data.success === true) {
                  eventBus.$emit('init')
                  this.$swal({ type: 'success', title: 'Success' })
                } else {
                  this.$swal({ type: 'error', title: 'Error', text: res.data.msg })
                }
              })
              .catch((err) => {
                this.$swal({ type: 'error', title: 'Error', text: err.message })
              })
          }
        })
    }
  }
}
</script>
