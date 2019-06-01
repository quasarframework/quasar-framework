import Menu from 'assets/menu.js'
import './AppMenu.styl'

export default {
  name: 'AppMenu',

  watch: {
    $route (route) {
      this.showMenu(this.$refs[route.path])
    }
  },

  methods: {
    showMenu (comp) {
      if (comp !== void 0 && comp !== this) {
        this.showMenu(comp.$parent)
        comp.show !== void 0 && comp.show()
      }
    },

    getDrawerMenu (h, menu, path, level) {
      if (menu.children !== void 0) {
        return h(
          'q-expansion-item',
          {
            staticClass: 'non-selectable',
            ref: path,
            props: {
              label: menu.name,
              dense: level > 0,
              icon: menu.icon,
              defaultOpened: menu.opened,
              expandSeparator: true,
              switchToggleSide: level > 0,
              denseToggle: level > 0
            }
          },
          menu.children.map(item => this.getDrawerMenu(
            h,
            item,
            path + (item.path !== void 0 ? '/' + item.path : ''),
            level + 1
          ))
        )
      }

      return h('q-item', {
        ref: path,
        props: {
          to: path,
          dense: level > 0,
          insetLevel: level > 1 ? 1.2 : level
        },
        staticClass: 'app-menu-entry non-selectable'
      }, [
        menu.icon !== void 0
          ? h('q-item-section', {
            props: { avatar: true }
          }, [ h('q-icon', { props: { name: menu.icon } }) ])
          : null,

        h('q-item-section', [ menu.name ]),

        menu.badge !== void 0
          ? h('q-item-section', {
            props: { side: true }
          }, [ h('q-badge', [ menu.badge ]) ])
          : null
      ])
    }
  },

  render (h) {
    return h('q-list', { staticClass: 'app-menu' }, Menu.map(
      item => this.getDrawerMenu(h, item, '/' + item.path, 0)
    ))
  },

  mounted () {
    this.showMenu(this.$refs[this.$route.path])
  }
}
