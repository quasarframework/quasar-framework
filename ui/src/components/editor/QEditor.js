import { h, defineComponent, ref, computed, watch, onMounted, nextTick, getCurrentInstance } from 'vue'

import Caret from './editor-caret.js'
import { getToolbar, getFonts, getLinkEditor } from './editor-utils.js'

import useDark, { useDarkProps } from '../../composables/private/use-dark.js'
import useFullscreen, { useFullscreenProps, useFullscreenEmits } from '../../composables/private/use-fullscreen.js'
import useSplitAttrs from '../../composables/private/use-split-attrs.js'

import { stopAndPrevent } from '../../utils/event.js'
import extend from '../../utils/extend.js'
import { shouldIgnoreKey } from '../../utils/private/key-composition.js'
import { addFocusFn } from '../../utils/private/focus-manager.js'

export default defineComponent({
  name: 'QEditor',

  props: {
    ...useDarkProps,
    ...useFullscreenProps,

    modelValue: {
      type: String,
      required: true
    },
    readonly: Boolean,
    disable: Boolean,
    minHeight: {
      type: String,
      default: '10rem'
    },
    maxHeight: String,
    height: String,
    definitions: Object,
    fonts: Object,
    placeholder: String,

    toolbar: {
      type: Array,
      validator: v => v.length === 0 || v.every(group => group.length),
      default () {
        return [
          [ 'left', 'center', 'right', 'justify' ],
          [ 'bold', 'italic', 'underline', 'strike' ],
          [ 'undo', 'redo' ]
        ]
      }
    },
    toolbarColor: String,
    toolbarBg: String,
    toolbarTextColor: String,
    toolbarToggleColor: {
      type: String,
      default: 'primary'
    },
    toolbarOutline: Boolean,
    toolbarPush: Boolean,
    toolbarRounded: Boolean,

    paragraphTag: {
      type: String,
      validator: v => [ 'div', 'p' ].includes(v),
      default: 'div'
    },

    contentStyle: Object,
    contentClass: [ Object, Array, String ],

    square: Boolean,
    flat: Boolean,
    dense: Boolean
  },

  emits: [
    ...useFullscreenEmits,
    'update:modelValue',
    'keydown', 'click', 'mouseup', 'keyup', 'touchend',
    'focus', 'blur'
  ],

  setup (props, { slots, emit, attrs }) {
    const { proxy } = getCurrentInstance()
    const { $q } = proxy

    const isDark = useDark(props, $q)
    const { inFullscreen, toggleFullscreen } = useFullscreen()
    const splitAttrs = useSplitAttrs(attrs)

    const rootRef = ref(null)
    const contentRef = ref(null)

    const editLinkUrl = ref(null)
    const isViewingSource = ref(false)

    const editable = computed(() => !props.readonly && !props.disable)

    let defaultFont, offsetBottom
    let lastEmit = props.modelValue // eslint-disable-line

    if (__QUASAR_SSR_SERVER__ !== true) {
      document.execCommand('defaultParagraphSeparator', false, props.paragraphTag)
      defaultFont = window.getComputedStyle(document.body).fontFamily
    }

    const toolbarBackgroundClass = computed(() => (
      props.toolbarBg ? ` bg-${ props.toolbarBg }` : ''
    ))

    const buttonProps = computed(() => {
      const flat = props.toolbarOutline !== true
        && props.toolbarPush !== true

      return {
        type: 'a',
        flat,
        noWrap: true,
        outline: props.toolbarOutline,
        push: props.toolbarPush,
        rounded: props.toolbarRounded,
        dense: true,
        color: props.toolbarColor,
        disable: !editable.value,
        size: 'sm'
      }
    })

    const buttonDef = computed(() => {
      const
        e = $q.lang.editor,
        i = $q.iconSet.editor

      return {
        bold: { cmd: 'bold', icon: i.bold, tip: e.bold, key: 66 },
        italic: { cmd: 'italic', icon: i.italic, tip: e.italic, key: 73 },
        strike: { cmd: 'strikeThrough', icon: i.strikethrough, tip: e.strikethrough, key: 83 },
        underline: { cmd: 'underline', icon: i.underline, tip: e.underline, key: 85 },
        unordered: { cmd: 'insertUnorderedList', icon: i.unorderedList, tip: e.unorderedList },
        ordered: { cmd: 'insertOrderedList', icon: i.orderedList, tip: e.orderedList },
        subscript: { cmd: 'subscript', icon: i.subscript, tip: e.subscript, htmlTip: 'x<subscript>2</subscript>' },
        superscript: { cmd: 'superscript', icon: i.superscript, tip: e.superscript, htmlTip: 'x<superscript>2</superscript>' },
        link: { cmd: 'link', disable: eVm => eVm.caret && !eVm.caret.can('link'), icon: i.hyperlink, tip: e.hyperlink, key: 76 },
        fullscreen: { cmd: 'fullscreen', icon: i.toggleFullscreen, tip: e.toggleFullscreen, key: 70 },
        viewsource: { cmd: 'viewsource', icon: i.viewSource, tip: e.viewSource },

        quote: { cmd: 'formatBlock', param: 'BLOCKQUOTE', icon: i.quote, tip: e.quote, key: 81 },
        left: { cmd: 'justifyLeft', icon: i.left, tip: e.left },
        center: { cmd: 'justifyCenter', icon: i.center, tip: e.center },
        right: { cmd: 'justifyRight', icon: i.right, tip: e.right },
        justify: { cmd: 'justifyFull', icon: i.justify, tip: e.justify },

        print: { type: 'no-state', cmd: 'print', icon: i.print, tip: e.print, key: 80 },
        outdent: { type: 'no-state', disable: eVm => eVm.caret && !eVm.caret.can('outdent'), cmd: 'outdent', icon: i.outdent, tip: e.outdent },
        indent: { type: 'no-state', disable: eVm => eVm.caret && !eVm.caret.can('indent'), cmd: 'indent', icon: i.indent, tip: e.indent },
        removeFormat: { type: 'no-state', cmd: 'removeFormat', icon: i.removeFormat, tip: e.removeFormat },
        hr: { type: 'no-state', cmd: 'insertHorizontalRule', icon: i.hr, tip: e.hr },
        undo: { type: 'no-state', cmd: 'undo', icon: i.undo, tip: e.undo, key: 90 },
        redo: { type: 'no-state', cmd: 'redo', icon: i.redo, tip: e.redo, key: 89 },

        h1: { cmd: 'formatBlock', param: 'H1', icon: i.heading1 || i.heading, tip: e.heading1, htmlTip: `<h1 class="q-ma-none">${ e.heading1 }</h1>` },
        h2: { cmd: 'formatBlock', param: 'H2', icon: i.heading2 || i.heading, tip: e.heading2, htmlTip: `<h2 class="q-ma-none">${ e.heading2 }</h2>` },
        h3: { cmd: 'formatBlock', param: 'H3', icon: i.heading3 || i.heading, tip: e.heading3, htmlTip: `<h3 class="q-ma-none">${ e.heading3 }</h3>` },
        h4: { cmd: 'formatBlock', param: 'H4', icon: i.heading4 || i.heading, tip: e.heading4, htmlTip: `<h4 class="q-ma-none">${ e.heading4 }</h4>` },
        h5: { cmd: 'formatBlock', param: 'H5', icon: i.heading5 || i.heading, tip: e.heading5, htmlTip: `<h5 class="q-ma-none">${ e.heading5 }</h5>` },
        h6: { cmd: 'formatBlock', param: 'H6', icon: i.heading6 || i.heading, tip: e.heading6, htmlTip: `<h6 class="q-ma-none">${ e.heading6 }</h6>` },
        p: { cmd: 'formatBlock', param: props.paragraphTag, icon: i.heading, tip: e.paragraph },
        code: { cmd: 'formatBlock', param: 'PRE', icon: i.code, htmlTip: `<code>${ e.code }</code>` },

        'size-1': { cmd: 'fontSize', param: '1', icon: i.size1 || i.size, tip: e.size1, htmlTip: `<font size="1">${ e.size1 }</font>` },
        'size-2': { cmd: 'fontSize', param: '2', icon: i.size2 || i.size, tip: e.size2, htmlTip: `<font size="2">${ e.size2 }</font>` },
        'size-3': { cmd: 'fontSize', param: '3', icon: i.size3 || i.size, tip: e.size3, htmlTip: `<font size="3">${ e.size3 }</font>` },
        'size-4': { cmd: 'fontSize', param: '4', icon: i.size4 || i.size, tip: e.size4, htmlTip: `<font size="4">${ e.size4 }</font>` },
        'size-5': { cmd: 'fontSize', param: '5', icon: i.size5 || i.size, tip: e.size5, htmlTip: `<font size="5">${ e.size5 }</font>` },
        'size-6': { cmd: 'fontSize', param: '6', icon: i.size6 || i.size, tip: e.size6, htmlTip: `<font size="6">${ e.size6 }</font>` },
        'size-7': { cmd: 'fontSize', param: '7', icon: i.size7 || i.size, tip: e.size7, htmlTip: `<font size="7">${ e.size7 }</font>` }
      }
    })

    const buttons = computed(() => {
      const userDef = props.definitions || {}
      const def = props.definitions || props.fonts
        ? extend(
            true,
            {},
            buttonDef.value,
            userDef,
            getFonts(
              defaultFont,
              $q.lang.editor.defaultFont,
              $q.iconSet.editor.font,
              props.fonts
            )
          )
        : buttonDef.value

      return props.toolbar.map(
        group => group.map(token => {
          if (token.options) {
            return {
              type: 'dropdown',
              icon: token.icon,
              label: token.label,
              size: 'sm',
              dense: true,
              fixedLabel: token.fixedLabel,
              fixedIcon: token.fixedIcon,
              highlight: token.highlight,
              list: token.list,
              options: token.options.map(item => def[ item ])
            }
          }

          const obj = def[ token ]

          if (obj) {
            return obj.type === 'no-state' || (userDef[ token ] && (
              obj.cmd === void 0 || (buttonDef.value[ obj.cmd ] && buttonDef.value[ obj.cmd ].type === 'no-state')
            ))
              ? obj
              : Object.assign({ type: 'toggle' }, obj)
          }
          else {
            return {
              type: 'slot',
              slot: token
            }
          }
        })
      )
    })

    const eVm = {
      $q,
      props,
      slots,
      // caret (will get injected after mount)
      inFullscreen,
      toggleFullscreen,
      runCmd,
      isViewingSource,
      editLinkUrl,
      toolbarBackgroundClass,
      buttonProps,
      contentRef,
      buttons,
      setContent
    }

    watch(() => props.modelValue, v => {
      if (lastEmit !== v) {
        lastEmit = v
        setContent(v, true)
      }
    })

    const hasToolbar = computed(() => props.toolbar && props.toolbar.length > 0)

    const keys = computed(() => {
      const
        k = {},
        add = btn => {
          if (btn.key) {
            k[ btn.key ] = {
              cmd: btn.cmd,
              param: btn.param
            }
          }
        }

      buttons.value.forEach(group => {
        group.forEach(token => {
          if (token.options) {
            token.options.forEach(add)
          }
          else {
            add(token)
          }
        })
      })
      return k
    })

    const innerStyle = computed(() => (
      inFullscreen.value
        ? props.contentStyle
        : [
            {
              minHeight: props.minHeight,
              height: props.height,
              maxHeight: props.maxHeight
            },
            props.contentStyle
          ]
    ))

    const classes = computed(() =>
      `q-editor q-editor--${ isViewingSource.value === true ? 'source' : 'default' }`
      + (props.disable === true ? ' disabled' : '')
      + (inFullscreen.value === true ? ' fullscreen column' : '')
      + (props.square === true ? ' q-editor--square no-border-radius' : '')
      + (props.flat === true ? ' q-editor--flat' : '')
      + (props.dense === true ? ' q-editor--dense' : '')
      + (isDark.value === true ? ' q-editor--dark q-dark' : '')
    )

    const innerClass = computed(() => ([
      props.contentClass,
      'q-editor__content',
      { col: inFullscreen.value, 'overflow-auto': inFullscreen.value || props.maxHeight }
    ]))

    const attributes = computed(() => (
      props.disable === true
        ? { 'aria-disabled': 'true' }
        : (props.readonly === true ? { 'aria-readonly': 'true' } : {})
    ))

    function onInput () {
      if (contentRef.value !== null) {
        const prop = `inner${ isViewingSource.value === true ? 'Text' : 'HTML' }`
        const val = contentRef.value[ prop ]

        if (val !== props.modelValue) {
          lastEmit = val
          emit('update:modelValue', val)
        }
      }
    }

    function onKeydown (e) {
      emit('keydown', e)

      if (e.ctrlKey !== true || shouldIgnoreKey(e) === true) {
        refreshToolbar()
        return
      }

      const key = e.keyCode
      const target = keys.value[ key ]
      if (target !== void 0) {
        const { cmd, param } = target
        stopAndPrevent(e)
        runCmd(cmd, param, false)
      }
    }

    function onClick (e) {
      refreshToolbar()
      emit('click', e)
    }

    function onBlur (e) {
      if (contentRef.value !== null) {
        const { scrollTop, scrollHeight } = contentRef.value
        offsetBottom = scrollHeight - scrollTop
      }
      eVm.caret.save()
      emit('blur', e)
    }

    function onFocus (e) {
      nextTick(() => {
        if (contentRef.value !== null && offsetBottom !== void 0) {
          contentRef.value.scrollTop = contentRef.value.scrollHeight - offsetBottom
        }
        this.$emit('focus')
      })
      emit('focus', e)
    }

    function onFocusin (e) {
      if (
        rootRef.value.contains(e.target) === true
        && (
          e.relatedTarget === null
          || rootRef.value.contains(e.relatedTarget) !== true
        )
      ) {
        const prop = `inner${ isViewingSource.value === true ? 'Text' : 'HTML' }`
        eVm.caret.restorePosition(contentRef.value[ prop ].length)
        refreshToolbar()
      }
    }

    function onFocusout (e) {
      if (
        rootRef.value.contains(e.target) === true
        && (
          e.relatedTarget === null
          || rootRef.value.contains(e.relatedTarget) !== true
        )
      ) {
        eVm.caret.savePosition()
        refreshToolbar()
      }
    }

    function onMousedown () {
      offsetBottom = void 0
    }

    function onMouseup (e) {
      eVm.caret.save()
      emit('mouseup', e)
    }

    function onTouchstartPassive () {
      offsetBottom = void 0
    }

    function onKeyup (e) {
      eVm.caret.save()
      emit('keyup', e)
    }

    function onTouchend (e) {
      eVm.caret.save()
      emit('touchend', e)
    }

    function setContent (v, restorePosition) {
      if (contentRef.value !== null) {
        if (restorePosition === true) {
          eVm.caret.savePosition()
        }

        const prop = `inner${ isViewingSource.value === true ? 'Text' : 'HTML' }`
        contentRef.value[ prop ] = v

        if (restorePosition === true) {
          eVm.caret.restorePosition(contentRef.value[ prop ].length)
          refreshToolbar()
        }
      }
    }

    function runCmd (cmd, param, update = true) {
      focus()
      eVm.caret.restore()
      eVm.caret.apply(cmd, param, () => {
        focus()
        eVm.caret.save()
        if (update) {
          refreshToolbar()
        }
      })
    }

    function refreshToolbar () {
      setTimeout(() => {
        editLinkUrl.value = null
        proxy.$forceUpdate()
      }, 1)
    }

    function focus () {
      addFocusFn(() => {
        contentRef.value !== null && contentRef.value.focus()
      })
    }

    function getContentEl () {
      return contentRef.value
    }

    // expose public methods
    Object.assign(proxy, {
      runCmd, refreshToolbar, focus, getContentEl
    })

    onMounted(() => {
      eVm.caret = new Caret(contentRef.value, eVm)
      setContent(props.modelValue)
      refreshToolbar()
    })

    return () => {
      let toolbars

      if (hasToolbar.value) {
        const bars = [
          h('div', {
            key: 'qedt_top',
            class: 'q-editor__toolbar row no-wrap scroll-x'
              + toolbarBackgroundClass.value
          }, getToolbar(eVm))
        ]

        editLinkUrl.value !== null && bars.push(
          h('div', {
            key: 'qedt_btm',
            class: 'q-editor__toolbar row no-wrap items-center scroll-x'
              + toolbarBackgroundClass.value
          }, getLinkEditor(eVm))
        )

        toolbars = h('div', {
          key: 'toolbar_ctainer',
          class: 'q-editor__toolbars-container'
        }, bars)
      }

      return h('div', {
        ref: rootRef,
        class: classes.value,
        style: { height: inFullscreen.value === true ? '100vh' : null },
        ...attributes.value,
        onFocusin,
        onFocusout
      }, [
        toolbars,

        h('div', {
          ref: contentRef,
          style: innerStyle.value,
          class: innerClass.value,
          contenteditable: editable.value,
          placeholder: props.placeholder,
          ...(__QUASAR_SSR_SERVER__
            ? { innerHTML: props.modelValue }
            : {}),
          ...splitAttrs.listeners.value,
          onInput,
          onKeydown,
          onClick,
          onBlur,
          onFocus,

          // clean saved scroll position
          onMousedown,
          onTouchstartPassive,

          // save caret
          onMouseup,
          onKeyup,
          onTouchend
        })
      ])
    }
  }
})
