import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Custom from '../views/Custom.vue'
import Stage from '../views/Stage.vue'
import ToolSettings from '../views/ToolSettings.vue'
import GameSettings from '../views/GameSettings.vue'
import NoteSettings from '../views/NoteSettings.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/custom',
    name: 'custom',
    component: Custom
  },
  {
    path: '/settings/tool',
    name: 'settings',
    component: ToolSettings
  },
  {
    path: '/settings/game',
    name: 'settings',
    component: GameSettings
  },
  {
    path: '/settings/note',
    name: 'settings',
    component: NoteSettings
  },
  {
    path: '/stage/:mode/:num',
    name: 'stage',
    component: Stage
  }
]

const router = new VueRouter({
  routes
})

export default router
