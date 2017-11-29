import { QIcon } from '../icon'

export default {
  name: 'q-item-side',
  functional: true,
  props: {
    right: Boolean,

    icon: String,
    inverted: Boolean,

    avatar: String,
    letter: {
      type: String,
      validator: v => v.length === 1
    },
    image: String,
    stamp: String,

    color: String,
    tag: {
      type: String,
      default: 'div'
    }
  },
  render (h, ctx) {
    const
      data = ctx.data,
      prop = ctx.props,
      cls = data.staticClass
    let color = ''
    if (prop.letter) {
      if (prop.inverted) {
        color = 'q-item-text-inverted'
        if (prop.color) {
          color = `${color} text-white bg-${prop.color}`
        }
      }
      else {
        if (prop.color) {
          color = `text-${prop.color}`
        }
      }
    }
    data.staticClass =  `q-item-side q-item-side-${prop.right ? 'right' : 'left'} q-item-section ${color} ${cls ? ` ${cls}` : ''}`

    if (prop.image) {
      if (!data.hasOwnProperty('attrs')) {
        data.attrs = {}
      }
      data.attrs.src = prop.image
      data.staticClass += ' q-item-image'
      return h('img', data)
    }

    let child = []

    if (prop.stamp) {
      child.push(h('div', {
        staticClass: 'q-item-stamp',
        domProps: {
          innerHTML: prop.stamp
        }
      }))
    }
    if (prop.icon) {
      child.push(h(QIcon, {
        props: { name: prop.icon },
        staticClass: 'q-item-icon',
        class: { 'q-item-icon-inverted': prop.inverted }
      }))
    }
    if (prop.avatar) {
      child.push(h('img', {
        attrs: { src: prop.avatar },
        staticClass: 'q-item-avatar'
      }))
    }
    if (prop.letter) {
      child.push(h(
        'div',
        { staticClass: 'q-item-letter' },
        prop.letter
      ))
    }

    child.push(ctx.children)
    return h(prop.tag, data, child)
  }
}
