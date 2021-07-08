import { h, defineComponent, ref, computed, watch, onBeforeUnmount, onMounted, nextTick, getCurrentInstance } from 'vue'

import useField, { useFieldState, useFieldProps, useFieldEmits, fieldValueIsFilled } from '../../composables/private/use-field.js'
import useMask, { useMaskProps } from './use-mask.js'
import { useFormProps, useFormInputNameAttr } from '../../composables/private/use-form.js'
import useFileFormDomProps from '../../composables/private/use-file-dom-props.js'
import useKeyComposition from '../../composables/private/use-key-composition.js'

import { stop } from '../../utils/event.js'
import { addFocusFn } from '../../utils/private/focus-manager.js'

export default defineComponent({
  name: 'QInput',

  inheritAttrs: false,

  props: {
    ...useFieldProps,
    ...useMaskProps,
    ...useFormProps,

    modelValue: { required: false },

    shadowText: String,

    type: {
      type: String,
      default: 'text'
    },

    debounce: [ String, Number ],

    autogrow: Boolean, // makes a textarea

    inputClass: [ Array, String, Object ],
    inputStyle: [ Array, String, Object ]
  },

  emits: [
    ...useFieldEmits,
    'paste', 'change'
  ],

  setup (props, { emit, attrs }) {
    const temp = {}
    let emitCachedValue = NaN, typedNumber, stopValueWatcher, emitTimer, emitValueFn

    const inputRef = ref(null)
    const nameProp = useFormInputNameAttr(props)

    const {
      innerValue,
      hasMask,
      moveCursorForPaste,
      updateMaskValue,
      onMaskedKeydown
    } = useMask(props, emit, emitValue, inputRef)

    const formDomProps = useFileFormDomProps(props, /* type guard */ true)
    const hasValue = computed(() => fieldValueIsFilled(innerValue.value))

    const onComposition = useKeyComposition(onInput)

    const state = useFieldState()

    const isTextarea = computed(() =>
      props.type === 'textarea' || props.autogrow === true
    )

    const isTypeText = computed(() =>
      isTextarea === true || ['text', 'search', 'url', 'tel', 'password'].includes(props.type)
    )

    const onEvents = computed(() => {
      const evt = {
        ...state.splitAttrs.listeners.value,
        onInput,
        onPaste,
        // Safari < 10.2 & UIWebView doesn't fire compositionend when
        // switching focus before confirming composition choice
        // this also fixes the issue where some browsers e.g. iOS Chrome
        // fires "change" instead of "input" on autocomplete.
        onChange,
        onBlur: onFinishEditing,
        onFocus: stop
      }

      evt.onCompositionstart = evt.onCompositionupdate = evt.onCompositionend = onComposition

      if (hasMask.value === true) {
        evt.onKeydown = onMaskedKeydown
      }

      if (props.autogrow === true) {
        evt.onAnimationend = adjustHeight
      }

      return evt
    })

    const inputAttrs = computed(() => {
      const attrs = {
        tabindex: 0,
        'data-autofocus': props.autofocus === true || void 0,
        rows: props.type === 'textarea' ? 6 : void 0,
        'aria-label': props.label,
        name: nameProp.value,
        ...state.splitAttrs.attributes.value,
        id: state.targetUid.value,
        maxlength: props.maxlength,
        disabled: props.disable === true,
        readonly: props.readonly === true
      }

      if (isTextarea.value === false) {
        attrs.type = props.type
      }

      if (props.autogrow === true) {
        attrs.rows = 1
      }

      return attrs
    })

    watch(() => props.modelValue, v => {
      if (hasMask.value === true) {
        if (stopValueWatcher === true) {
          stopValueWatcher = false
          return
        }

        updateMaskValue(v)
      }
      else if (innerValue.value !== v) {
        innerValue.value = v

        if (
          props.type === 'number'
          && temp.hasOwnProperty('value') === true
        ) {
          if (typedNumber === true) {
            typedNumber = false
          }
          else {
            delete temp.value
          }
        }
      }

      // textarea only
      props.autogrow === true && nextTick(adjustHeight)
    })

    watch(() => props.autogrow, val => {
      // textarea only
      if (val === true) {
        nextTick(adjustHeight)
      }
      // if it has a number of rows set respect it
      else if (inputRef.value !== null && attrs.rows > 0) {
        inputRef.value.style.height = 'auto'
      }
    })

    watch(() => props.dense, () => {
      props.autogrow === true && nextTick(adjustHeight)
    })

    function focus () {
      addFocusFn(() => {
        const el = document.activeElement
        if (
          inputRef.value !== null
          && inputRef.value !== el
          && (el === null || el.id !== state.targetUid.value)
        ) {
          inputRef.value.focus()
        }
      })
    }

    function select () {
      inputRef.value !== null && inputRef.value.select()
    }

    function onPaste (e) {
      if (hasMask.value === true && props.reverseFillMask !== true) {
        const inp = e.target
        moveCursorForPaste(inp, inp.selectionStart, inp.selectionEnd)
      }

      emit('paste', e)
    }

    function onInput (e) {
      if (!e || !e.target || e.target.composing === true) {
        return
      }

      if (props.type === 'file') {
        emit('update:modelValue', e.target.files)
        return
      }

      const val = e.target.value

      if (hasMask.value === true) {
        updateMaskValue(val, false, e.inputType)
      }
      else {
        emitValue(val)

        if (isTypeText === true && e.target === document.activeElement) {
          const { selectionStart, selectionEnd } = e.target

          if (selectionStart !== void 0 && selectionEnd !== void 0) {
            nextTick(() => {
              if (e.target === document.activeElement && val.indexOf(e.target.value) === 0) {
                e.target.setSelectionRange(selectionStart, selectionEnd)
              }
            })
          }
        }
      }

      // we need to trigger it immediately too,
      // to avoid "flickering"
      props.autogrow === true && adjustHeight()
    }

    function emitValue (val, stopWatcher) {
      emitValueFn = () => {
        if (
          props.type !== 'number'
          && temp.hasOwnProperty('value') === true
        ) {
          delete temp.value
        }

        if (props.modelValue !== val && emitCachedValue !== val) {
          stopWatcher === true && (stopValueWatcher = true)
          emit('update:modelValue', val)

          nextTick(() => {
            emitCachedValue === val && (emitCachedValue = NaN)
          })
        }

        emitValueFn = void 0
      }

      if (props.type === 'number') {
        typedNumber = true
        temp.value = val
      }

      if (props.debounce !== void 0) {
        clearTimeout(emitTimer)
        temp.value = val
        emitTimer = setTimeout(emitValueFn, props.debounce)
      }
      else {
        emitValueFn()
      }
    }

    // textarea only
    function adjustHeight () {
      const inp = inputRef.value
      if (inp !== null) {
        const parentStyle = inp.parentNode.style

        // reset height of textarea to a small size to detect the real height
        // but keep the total control size the same
        parentStyle.marginBottom = (inp.scrollHeight - 1) + 'px'
        inp.style.height = '1px'

        inp.style.height = inp.scrollHeight + 'px'
        parentStyle.marginBottom = ''
      }
    }

    function onChange (e) {
      onComposition(e)

      clearTimeout(emitTimer)
      emitValueFn !== void 0 && emitValueFn()

      emit('change', e.target.value)
    }

    function onFinishEditing (e) {
      e !== void 0 && stop(e)

      clearTimeout(emitTimer)
      emitValueFn !== void 0 && emitValueFn()

      typedNumber = false
      stopValueWatcher = false
      delete temp.value

      // we need to use setTimeout instead of this.$nextTick
      // to avoid a bug where focusout is not emitted for type date/time/week/...
      props.type !== 'file' && setTimeout(() => {
        if (inputRef.value !== null) {
          inputRef.value.value = innerValue.value !== void 0 ? innerValue.value : ''
        }
      })
    }

    function getCurValue () {
      return temp.hasOwnProperty('value') === true
        ? temp.value
        : (innerValue.value !== void 0 ? innerValue.value : '')
    }

    onBeforeUnmount(() => {
      onFinishEditing()
    })

    onMounted(() => {
      // textarea only
      props.autogrow === true && adjustHeight()
    })

    Object.assign(state, {
      innerValue,

      fieldClass: computed(() =>
        `q-${ isTextarea.value === true ? 'textarea' : 'input' }`
        + (props.autogrow === true ? ' q-textarea--autogrow' : '')
      ),

      hasShadow: computed(() =>
        props.type !== 'file'
        && typeof props.shadowText === 'string'
        && props.shadowText.length > 0
      ),

      inputRef,

      emitValue,

      hasValue,

      floatingLabel: computed(() =>
        hasValue.value === true
        || fieldValueIsFilled(props.displayValue)
      ),

      getControl: () => {
        return h(isTextarea.value === true ? 'textarea' : 'input', {
          ref: inputRef,
          class: [
            'q-field__native q-placeholder',
            props.inputClass
          ],
          style: props.inputStyle,
          ...inputAttrs.value,
          ...onEvents.value,
          ...(
            props.type !== 'file'
              ? { value: getCurValue() }
              : formDomProps.value
          )
        })
      },

      getShadowControl: () => {
        return h('div', {
          class: 'q-field__native q-field__shadow absolute-bottom no-pointer-events'
            + (isTextarea.value === true ? '' : ' text-no-wrap')
        }, [
          h('span', { class: 'invisible' }, getCurValue()),
          h('span', props.shadowText)
        ])
      }
    })

    const renderFn = useField(state)

    // expose public methods
    const vm = getCurrentInstance()
    Object.assign(vm.proxy, {
      focus,
      select,
      getNativeElement: () => inputRef.value
    })

    return renderFn
  }
})
