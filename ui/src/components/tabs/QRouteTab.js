import Vue from 'vue'

import QTab from './QTab.js'
import { RouterLinkMixin } from '../../mixins/router-link.js'
import { isSameRoute, isIncludedRoute } from '../../utils/router.js'
import { stopAndPrevent, noop } from '../../utils/event.js'

export default Vue.extend({
  name: 'QRouteTab',

  mixins: [ QTab, RouterLinkMixin ],

  props: {
    to: { required: true }
  },

  inject: {
    __activateRoute: {},
    __recalculateScroll: {}
  },

  watch: {
    $route () {
      this.__checkActivation()
    }
  },

  methods: {
    __activate (e, keyboard) {
      if (this.disable !== true) {
        if (
          e !== void 0 && (
            e.ctrlKey === true ||
            e.shiftKey === true ||
            e.altKey === true ||
            e.metaKey === true
          )
        ) {
          // if it has meta keys, let vue-router link
          // handle this by its own
          this.__checkActivation(true)
        }
        else {
          // we use programatic navigation instead of letting vue-router handle it
          // so we can check for activation when the navigation is complete
          e !== void 0 && stopAndPrevent(e)

          const go = (to = this.to, append = this.append, replace = this.replace) => {
            const { route } = this.$router.resolve(to, this.$route, append)
            const checkFn = to === this.to && append === this.append && replace === this.replace
              ? this.__checkActivation
              : noop

            // vue-router now throwing error if navigating
            // to the same route that the user is currently at
            // https://github.com/vuejs/vue-router/issues/2872
            this.$router[replace === true ? 'replace' : 'push'](
              route,
              () => { checkFn(true) },
              err => {
                if (err && err.name === 'NavigationDuplicated') {
                  checkFn(true)
                }
              }
            )
          }

          this.qListeners.click !== void 0 && this.$emit('click', e, go)
          if (e === void 0 || e.navigate !== false) {
            go()
          }
        }
      }

      if (keyboard === true) {
        this.$el.focus(e)
      }
      else {
        this.$refs.blurTarget !== void 0 && this.$refs.blurTarget.focus(e)
      }
    },

    __checkActivation (selected = false) {
      const
        current = this.$route,
        { href, location, route } = this.$router.resolve(this.to, current, this.append),
        redirected = route.redirectedFrom !== void 0,
        isSameRouteCheck = isSameRoute(current, route),
        checkFunction = this.exact === true ? isSameRoute : isIncludedRoute,
        params = {
          name: this.name,
          selected,
          exact: this.exact,
          priorityMatched: route.matched.length,
          priorityHref: href.length
        }

      if (isSameRouteCheck === true || (this.exact !== true && isIncludedRoute(current, route) === true)) {
        this.__activateRoute({
          ...params,
          redirected,
          // if it's an exact match give higher priority
          // even if the tab is not marked as exact
          exact: this.exact === true || isSameRouteCheck === true
        })
      }

      if (
        redirected === true &&
        checkFunction(current, {
          path: route.redirectedFrom,
          ...location
        }) === true
      ) {
        this.__activateRoute(params)
      }

      this.isActive === true && this.__activateRoute()
    }
  },

  mounted () {
    this.__recalculateScroll()
    this.$router !== void 0 && this.__checkActivation()
  },

  beforeDestroy () {
    this.__recalculateScroll()
    this.__activateRoute({ remove: true, name: this.name })
  },

  render (h) {
    return h('router-link', {
      staticClass: 'q-tab relative-position self-stretch flex flex-center text-center no-outline',
      class: this.classes,
      attrs: this.attrs,
      props: this.routerLinkProps,
      directives: this.ripple === false || this.disable === true ? null : [
        { name: 'ripple', value: this.computedRipple }
      ],
      nativeOn: this.onEvents,
      scopedSlots: {
        default: () => h('a', this.__getContent(h))
      }
    })
  }
})
