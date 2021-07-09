<template>
  <div>
    <div class="q-layout-padding q-mx-auto" style="max-width: 500px">
      <router-link to="/layout-quick/a" class="cursor-pointer row justify-center" style="margin-bottom: 25px">
        <img src="https://cdn.quasar.dev/img/quasar-logo.png">
      </router-link>
      <div class="text-caption text-center">
        Quasar v{{ $q.version }}
      </div>

      <div class="q-pt-md">
        <q-input ref="filter" clearable outlined v-model="filter">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <q-list dense class="q-mb-xl">
        <template v-for="(category, title) in filteredList">
          <q-item-label :key="`category-${title}`" header class="q-mt-lg text-uppercase text-weight-bold">
            {{ title }}
          </q-item-label>

          <q-item
            v-for="feature in category"
            :key="`${feature.route}${feature.title}`"
            :to="feature.route"
          >
            <q-item-section>{{ feature.title }}</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </div>
  </div>
</template>

<script>
import pages from 'src/router/pages-list'

const STORAGE_KEY = 'index-filter'

const list = {}
pages.map(page => page.slice(0, page.length - 4)).forEach(page => {
  const [folder, file] = page.split('/')
  if (!list[folder]) {
    list[folder] = []
  }
  list[folder].push({
    route: page,
    title: file.split(/-/).map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(' ')
  })
})

export default {
  created () {
    this.list = list
  },

  mounted () {
    if (process.env.MODE === 'ssr') {
      this.clientInitStore(this.store)
    }

    window.addEventListener('keydown', this.onKeyup, { passive: false, capture: true })
    this.$q.platform.is.desktop === true && this.$refs.filter.focus()
  },

  beforeDestroy () {
    window.removeEventListener('keydown', this.onKeyup, { passive: false, capture: true })
  },

  data () {
    const store = { filter: '' }

    if (process.env.MODE !== 'ssr') {
      this.clientInitStore(store)
    }

    return { store }
  },

  computed: {
    filteredList () {
      if (!this.filter) {
        return this.list
      }

      const newList = {}
      const filter = this.filter.toLowerCase()

      Object.keys(this.list).forEach(categName => {
        const filtered = this.list[categName]
          .filter(feature => feature.title.toLowerCase().indexOf(filter) > -1)

        if (filtered.length > 0) {
          newList[categName] = filtered
        }
      })

      return newList
    },

    filter: {
      get () {
        return this.store.filter
      },

      set (val) {
        const filter = val || ''
        this.store.filter = filter
        this.$q.localStorage.set(STORAGE_KEY, filter)
      }
    }
  },

  methods: {
    onKeyup (evt) {
      if (evt.keyCode === 38) { // up
        this.moveSelection(evt, 'previousSibling')
      }
      else if (evt.keyCode === 40) { // down
        this.moveSelection(evt, 'nextSibling')
      }
    },

    moveSelection (evt, op) {
      evt.preventDefault()

      let el = document.activeElement

      if (!el || el === document.body || el.tagName.toUpperCase() === 'INPUT') {
        this.focus(document.querySelector('.q-item'))
        return
      }

      if (el[op]) {
        do { el = el[op] }
        while (el && el.tagName.toUpperCase() !== 'A')

        if (!el) {
          this.focus(this.$refs.filter.$el)
        }
        else if (el.tagName.toUpperCase() === 'A') {
          this.focus(el)
        }
      }
    },

    focus (el) {
      el.focus()
      el.scrollIntoView(false)
    },

    clientInitStore (store) {
      const filter = this.$q.localStorage.getItem(STORAGE_KEY)
      if (filter) {
        store.filter = filter
      }
    }
  }
}
</script>
