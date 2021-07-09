import Vue from 'vue'

import QIcon from '../icon/QIcon.js'

import RippleMixin from '../../mixins/ripple.js'
import ListenersMixin from '../../mixins/listeners.js'

import { stop } from '../../utils/event.js'
import { mergeSlot } from '../../utils/slot.js'
import { isKeyCode } from '../../utils/key-composition.js'

let uid = 0

export default Vue.extend({
  name: 'QTab',

  mixins: [ RippleMixin, ListenersMixin ],

  inject: {
    tabs: {
      default () {
        console.error('QTab/QRouteTab components need to be child of QTabs')
      }
    },
    __activateTab: {},
    __recalculateScroll: {}
  },

  props: {
    icon: String,
    label: [Number, String],

    alert: [Boolean, String],
    alertIcon: String,

    name: {
      type: [Number, String],
      default: () => `t_${uid++}`
    },

    noCaps: Boolean,

    tabindex: [String, Number],
    disable: Boolean,

    contentClass: String
  },

  computed: {
    isActive () {
      return this.tabs.current === this.name
    },

    classes () {
      return {
        [`q-tab--${this.isActive ? '' : 'in'}active`]: true,
        [`text-${this.tabs.activeColor}`]: this.isActive && this.tabs.activeColor,
        [`bg-${this.tabs.activeBgColor}`]: this.isActive && this.tabs.activeBgColor,
        'q-tab--full': this.icon && this.label && !this.tabs.inlineLabel,
        'q-tab--no-caps': this.noCaps === true || this.tabs.noCaps === true,
        'q-focusable q-hoverable cursor-pointer': !this.disable,
        disabled: this.disable
      }
    },

    innerClass () {
      return (this.tabs.inlineLabel === true ? 'row no-wrap q-tab__content--inline' : 'column') +
        (this.contentClass !== void 0 ? ` ${this.contentClass}` : '')
    },

    computedTabIndex () {
      return this.disable === true || this.isActive === true ? -1 : this.tabindex || 0
    },

    onEvents () {
      return {
        input: stop,
        ...this.qListeners,
        click: this.__activate,
        keyup: this.__onKeyup
      }
    },

    attrs () {
      const attrs = {
        tabindex: this.computedTabIndex,
        role: 'tab',
        'aria-selected': this.isActive
      }

      if (this.disable === true) {
        attrs['aria-disabled'] = 'true'
      }

      return attrs
    }
  },

  methods: {
    __activate (e, keyboard) {
      keyboard !== true && this.$refs.blurTarget !== void 0 && this.$refs.blurTarget.focus()

      if (this.disable !== true) {
        this.qListeners.click !== void 0 && this.$emit('click', e)
        this.__activateTab(this.name)
      }
    },

    __onKeyup (e) {
      isKeyCode(e, 13) === true && this.__activate(e, true)
    },

    __getContent (h) {
      const
        narrow = this.tabs.narrowIndicator,
        content = [],
        indicator = h('div', {
          staticClass: 'q-tab__indicator',
          class: this.tabs.indicatorClass
        })

      this.icon !== void 0 && content.push(
        h(QIcon, {
          staticClass: 'q-tab__icon',
          props: { name: this.icon }
        })
      )

      this.label !== void 0 && content.push(
        h('div', {
          staticClass: 'q-tab__label'
        }, [ this.label ])
      )

      this.alert !== false && content.push(
        this.alertIcon !== void 0
          ? h(QIcon, {
            staticClass: 'q-tab__alert-icon',
            props: {
              color: this.alert !== true
                ? this.alert
                : void 0,
              name: this.alertIcon
            }
          })
          : h('div', {
            staticClass: 'q-tab__alert',
            class: this.alert !== true
              ? `text-${this.alert}`
              : null
          })
      )

      narrow === true && content.push(indicator)

      const node = [
        h('div', { staticClass: 'q-focus-helper', attrs: { tabindex: -1 }, ref: 'blurTarget' }),

        h('div', {
          staticClass: 'q-tab__content self-stretch flex-center relative-position q-anchor--skip non-selectable',
          class: this.innerClass
        }, mergeSlot(content, this, 'default'))
      ]

      narrow === false && node.push(indicator)

      return node
    }
  },

  mounted () {
    this.__recalculateScroll()
  },

  beforeDestroy () {
    this.__recalculateScroll()
  },

  render (h) {
    return h('div', {
      staticClass: 'q-tab relative-position self-stretch flex flex-center text-center no-outline',
      class: this.classes,
      attrs: this.attrs,
      directives: this.ripple === false || this.disable === true ? null : [
        { name: 'ripple', value: this.ripple }
      ],
      on: this.onEvents
    }, this.__getContent(h))
  }
})
