import Vue from 'vue'

import { mergeSlot } from '../../utils/slot.js'
import ListenersMixin from '../../mixins/listeners.js'

import QIcon from '../icon/QIcon.js'
import { RouterLinkMixin } from '../../mixins/router-link.js'

export default Vue.extend({
  name: 'QBreadcrumbsEl',

  mixins: [ ListenersMixin, RouterLinkMixin ],

  props: {
    label: String,
    icon: String
  },

  render (h) {
    const child = []

    this.icon !== void 0 && child.push(
      h(QIcon, {
        staticClass: 'q-breadcrumbs__el-icon',
        class: this.label !== void 0 ? 'q-breadcrumbs__el-icon--with-label' : null,
        props: { name: this.icon }
      })
    )

    this.label && child.push(this.label)

    return h(this.hasRouterLink === true ? 'router-link' : 'span', {
      staticClass: 'q-breadcrumbs__el q-link q-link--focusable flex inline items-center relative-position',
      props: this.hasRouterLink === true ? this.routerLinkProps : null,
      [this.hasRouterLink === true ? 'nativeOn' : 'on']: { ...this.qListeners }
    }, mergeSlot(child, this, 'default'))
  }
})
