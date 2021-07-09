import Vue from 'vue'

import DarkMixin from '../../mixins/dark.js'
import TagMixin from '../../mixins/tag.js'
import { RouterLinkMixin } from '../../mixins/router-link.js'
import ListenersMixin from '../../mixins/listeners.js'

import { uniqueSlot } from '../../utils/slot.js'
import { stopAndPrevent } from '../../utils/event.js'
import { isKeyCode } from '../../utils/key-composition.js'

export default Vue.extend({
  name: 'QItem',

  mixins: [ DarkMixin, RouterLinkMixin, TagMixin, ListenersMixin ],

  props: {
    active: Boolean,

    clickable: Boolean,
    dense: Boolean,
    insetLevel: Number,

    tabindex: [ String, Number ],

    focused: Boolean,
    manualFocus: Boolean
  },

  computed: {
    isActionable () {
      return this.clickable === true ||
        this.hasRouterLink === true ||
        this.tag === 'a' ||
        this.tag === 'label'
    },

    isClickable () {
      return this.disable !== true && this.isActionable === true
    },

    classes () {
      return {
        'q-item--clickable q-link cursor-pointer': this.isClickable,
        'q-focusable q-hoverable': this.isClickable === true && this.manualFocus === false,

        'q-manual-focusable': this.isClickable === true && this.manualFocus === true,
        'q-manual-focusable--focused': this.isClickable === true && this.focused === true,

        'q-item--dense': this.dense,
        'q-item--dark': this.isDark,
        'q-item--active': this.active,
        [this.activeClass]: this.active === true && this.hasRouterLink !== true && this.activeClass !== void 0,

        'disabled': this.disable
      }
    },

    style () {
      if (this.insetLevel !== void 0) {
        const dir = this.$q.lang.rtl === true ? 'Right' : 'Left'
        return {
          ['padding' + dir]: (16 + this.insetLevel * 56) + 'px'
        }
      }
    },

    onEvents () {
      return {
        ...this.qListeners,
        click: this.__onClick,
        keyup: this.__onKeyup
      }
    }
  },

  methods: {
    __getContent (h) {
      const child = uniqueSlot(this, 'default', [])
      this.isClickable === true && child.unshift(
        h('div', { staticClass: 'q-focus-helper', attrs: { tabindex: -1 }, ref: 'blurTarget' })
      )
      return child
    },

    __onClick (e) {
      if (this.isClickable === true) {
        if (this.$refs.blurTarget !== void 0) {
          if (e.qKeyEvent !== true && document.activeElement === this.$el) {
            this.$refs.blurTarget.focus()
          }
          else if (document.activeElement === this.$refs.blurTarget) {
            this.$el.focus()
          }
        }

        this.$emit('click', e)
      }
    },

    __onKeyup (e) {
      if (this.isClickable === true && isKeyCode(e, 13) === true) {
        stopAndPrevent(e)

        // for ripple
        e.qKeyEvent = true

        // for click trigger
        const evt = new MouseEvent('click', e)
        evt.qKeyEvent = true
        this.$el.dispatchEvent(evt)
      }

      this.$emit('keyup', e)
    }
  },

  render (h) {
    const data = {
      staticClass: 'q-item q-item-type row no-wrap',
      class: this.classes,
      style: this.style,
      [ this.hasRouterLink === true ? 'nativeOn' : 'on' ]: this.onEvents
    }

    if (this.isClickable === true) {
      data.attrs = {
        tabindex: this.tabindex || '0'
      }
    }
    else if (this.isActionable === true) {
      data.attrs = {
        'aria-disabled': 'true'
      }
    }

    if (this.hasRouterLink === true) {
      data.props = this.routerLinkProps

      return h('router-link', data, this.__getContent(h))
    }

    return h(
      this.tag,
      data,
      this.__getContent(h)
    )
  }
})
