import { ref, computed, watch, nextTick } from 'vue'

import { shouldIgnoreKey } from '../../utils/private/key-composition.js'

// leave NAMED_MASKS at top of file (code referenced from docs)
const NAMED_MASKS = {
  date: '####/##/##',
  datetime: '####/##/## ##:##',
  time: '##:##',
  fulltime: '##:##:##',
  phone: '(###) ### - ####',
  card: '#### #### #### ####'
}

const TOKENS = {
  '#': { pattern: '[\\d]', negate: '[^\\d]' },

  S: { pattern: '[a-zA-Z]', negate: '[^a-zA-Z]' },
  N: { pattern: '[0-9a-zA-Z]', negate: '[^0-9a-zA-Z]' },

  A: { pattern: '[a-zA-Z]', negate: '[^a-zA-Z]', transform: v => v.toLocaleUpperCase() },
  a: { pattern: '[a-zA-Z]', negate: '[^a-zA-Z]', transform: v => v.toLocaleLowerCase() },

  X: { pattern: '[0-9a-zA-Z]', negate: '[^0-9a-zA-Z]', transform: v => v.toLocaleUpperCase() },
  x: { pattern: '[0-9a-zA-Z]', negate: '[^0-9a-zA-Z]', transform: v => v.toLocaleLowerCase() }
}

const KEYS = Object.keys(TOKENS)
KEYS.forEach(key => {
  TOKENS[ key ].regex = new RegExp(TOKENS[ key ].pattern)
})

const
  tokenRegexMask = new RegExp('\\\\([^.*+?^${}()|([\\]])|([.*+?^${}()|[\\]])|([' + KEYS.join('') + '])|(.)', 'g'),
  escRegex = /[.*+?^${}()|[\]\\]/g

const MARKER = String.fromCharCode(1)

export const useMaskProps = {
  mask: String,
  reverseFillMask: Boolean,
  fillMask: [ Boolean, String ],
  unmaskedValue: Boolean
}

export default function (props, emit, emitValue, inputRef) {
  let maskMarked, maskReplaced, computedMask, computedUnmask

  const hasMask = ref(null)
  const innerValue = ref(getInitialMaskedValue())

  const isTypeText = computed(() =>
    props.autogrow === true || ['textarea', 'text', 'search', 'url', 'tel', 'password'].includes(props.type)
  )

  watch(() => props.type, updateMaskInternals)

  watch(() => props.mask, v => {
    if (v !== void 0) {
      updateMaskValue(innerValue.value, true)
    }
    else {
      const val = unmaskValue(innerValue.value)
      updateMaskInternals()
      props.modelValue !== val && emit('update:modelValue', val)
    }
  })

  watch(() => props.fillMask + props.reverseFillMask, () => {
    hasMask.value === true && updateMaskValue(innerValue.value, true)
  })

  watch(() => props.unmaskedValue, () => {
    hasMask.value === true && updateMaskValue(innerValue.value)
  })

  function getInitialMaskedValue () {
    updateMaskInternals()

    if (hasMask.value === true) {
      const masked = maskValue(unmaskValue(props.modelValue))

      return props.fillMask !== false
        ? fillWithMask(masked)
        : masked
    }

    return props.modelValue
  }

  function getPaddedMaskMarked (size) {
    if (size < maskMarked.length) {
      return maskMarked.slice(-size)
    }

    let pad = '', localMaskMarked = maskMarked
    const padPos = localMaskMarked.indexOf(MARKER)

    if (padPos > -1) {
      for (let i = size - localMaskMarked.length; i > 0; i--) {
        pad += MARKER
      }

      localMaskMarked = localMaskMarked.slice(0, padPos) + pad + localMaskMarked.slice(padPos)
    }

    return localMaskMarked
  }

  function updateMaskInternals () {
    hasMask.value = props.mask !== void 0
      && props.mask.length > 0
      && isTypeText === true

    if (hasMask.value === false) {
      computedUnmask = void 0
      maskMarked = ''
      maskReplaced = ''
      return
    }

    const
      localComputedMask = NAMED_MASKS[ props.mask ] === void 0
        ? props.mask
        : NAMED_MASKS[ props.mask ],
      fillChar = typeof props.fillMask === 'string' && props.fillMask.length > 0
        ? props.fillMask.slice(0, 1)
        : '_',
      fillCharEscaped = fillChar.replace(escRegex, '\\$&'),
      unmask = [],
      extract = [],
      mask = []

    let
      firstMatch = props.reverseFillMask === true,
      unmaskChar = '',
      negateChar = ''

    localComputedMask.replace(tokenRegexMask, (_, char1, esc, token, char2) => {
      if (token !== void 0) {
        const c = TOKENS[ token ]
        mask.push(c)
        negateChar = c.negate
        if (firstMatch === true) {
          extract.push('(?:' + negateChar + '+)?(' + c.pattern + '+)?(?:' + negateChar + '+)?(' + c.pattern + '+)?')
          firstMatch = false
        }
        extract.push('(?:' + negateChar + '+)?(' + c.pattern + ')?')
      }
      else if (esc !== void 0) {
        unmaskChar = '\\' + (esc === '\\' ? '' : esc)
        mask.push(esc)
        unmask.push('([^' + unmaskChar + ']+)?' + unmaskChar + '?')
      }
      else {
        const c = char1 !== void 0 ? char1 : char2
        unmaskChar = c === '\\' ? '\\\\\\\\' : c.replace(escRegex, '\\\\$&')
        mask.push(c)
        unmask.push('([^' + unmaskChar + ']+)?' + unmaskChar + '?')
      }
    })

    const
      unmaskMatcher = new RegExp(
        '^'
        + unmask.join('')
        + '(' + (unmaskChar === '' ? '.' : '[^' + unmaskChar + ']') + '+)?'
        + '$'
      ),
      extractLast = extract.length - 1,
      extractMatcher = extract.map((re, index) => {
        if (index === 0 && props.reverseFillMask === true) {
          return new RegExp('^' + fillCharEscaped + '*' + re)
        }
        else if (index === extractLast) {
          return new RegExp(
            '^' + re
            + '(' + (negateChar === '' ? '.' : negateChar) + '+)?'
            + (props.reverseFillMask === true ? '$' : fillCharEscaped + '*')
          )
        }

        return new RegExp('^' + re)
      })

    computedMask = mask
    computedUnmask = val => {
      const unmaskMatch = unmaskMatcher.exec(val)
      if (unmaskMatch !== null) {
        val = unmaskMatch.slice(1).join('')
      }

      const
        extractMatch = [],
        extractMatcherLength = extractMatcher.length

      for (let i = 0, str = val; i < extractMatcherLength; i++) {
        const m = extractMatcher[ i ].exec(str)

        if (m === null) {
          break
        }

        str = str.slice(m.shift().length)
        extractMatch.push(...m)
      }
      if (extractMatch.length > 0) {
        return extractMatch.join('')
      }

      return val
    }
    maskMarked = mask.map(v => (typeof v === 'string' ? v : MARKER)).join('')
    maskReplaced = maskMarked.split(MARKER).join(fillChar)
  }

  function updateMaskValue (rawVal, updateMaskInternalsFlag, inputType) {
    const
      inp = inputRef.value,
      end = inp.selectionEnd,
      endReverse = inp.value.length - end,
      unmasked = unmaskValue(rawVal)

    // Update here so unmask uses the original fillChar
    updateMaskInternalsFlag === true && updateMaskInternals()

    const
      preMasked = maskValue(unmasked),
      masked = props.fillMask !== false
        ? fillWithMask(preMasked)
        : preMasked,
      changed = innerValue.value !== masked

    // We want to avoid "flickering" so we set value immediately
    inp.value !== masked && (inp.value = masked)

    changed === true && (innerValue.value = masked)

    document.activeElement === inp && nextTick(() => {
      if (masked === maskReplaced) {
        const cursor = props.reverseFillMask === true ? maskReplaced.length : 0
        inp.setSelectionRange(cursor, cursor, 'forward')

        return
      }

      if (inputType === 'insertFromPaste' && props.reverseFillMask !== true) {
        const cursor = end - 1
        moveCursor.right(inp, cursor, cursor)

        return
      }

      if ([ 'deleteContentBackward', 'deleteContentForward' ].indexOf(inputType) > -1) {
        const cursor = props.reverseFillMask === true
          ? (
              end === 0
                ? (masked.length > preMasked.length ? 1 : 0)
                : Math.max(0, masked.length - (masked === maskReplaced ? 0 : Math.min(preMasked.length, endReverse) + 1)) + 1
            )
          : end

        inp.setSelectionRange(cursor, cursor, 'forward')
        return
      }

      if (props.reverseFillMask === true) {
        if (changed === true) {
          const cursor = Math.max(0, masked.length - (masked === maskReplaced ? 0 : Math.min(preMasked.length, endReverse + 1)))

          if (cursor === 1 && end === 1) {
            inp.setSelectionRange(cursor, cursor, 'forward')
          }
          else {
            moveCursor.rightReverse(inp, cursor, cursor)
          }
        }
        else {
          const cursor = masked.length - endReverse
          inp.setSelectionRange(cursor, cursor, 'backward')
        }
      }
      else {
        if (changed === true) {
          const cursor = Math.max(0, maskMarked.indexOf(MARKER), Math.min(preMasked.length, end) - 1)
          moveCursor.right(inp, cursor, cursor)
        }
        else {
          const cursor = end - 1
          moveCursor.right(inp, cursor, cursor)
        }
      }
    })

    const val = props.unmaskedValue === true
      ? unmaskValue(masked)
      : masked

    props.modelValue !== val && emitValue(val, true)
  }

  function moveCursorForPaste (inp, start, end) {
    const preMasked = maskValue(unmaskValue(inp.value))

    start = Math.max(0, maskMarked.indexOf(MARKER), Math.min(preMasked.length, start))

    inp.setSelectionRange(start, end, 'forward')
  }

  const moveCursor = {
    left (inp, start, end, selection) {
      const noMarkBefore = maskMarked.slice(start - 1).indexOf(MARKER) === -1
      let i = Math.max(0, start - 1)

      for (; i >= 0; i--) {
        if (maskMarked[ i ] === MARKER) {
          start = i
          noMarkBefore === true && start++
          break
        }
      }

      if (
        i < 0
        && maskMarked[ start ] !== void 0
        && maskMarked[ start ] !== MARKER
      ) {
        return moveCursor.right(inp, 0, 0)
      }

      start >= 0 && inp.setSelectionRange(
        start,
        selection === true ? end : start, 'backward'
      )
    },

    right (inp, start, end, selection) {
      const limit = inp.value.length
      let i = Math.min(limit, end + 1)

      for (; i <= limit; i++) {
        if (maskMarked[ i ] === MARKER) {
          end = i
          break
        }
        else if (maskMarked[ i - 1 ] === MARKER) {
          end = i
        }
      }

      if (
        i > limit
        && maskMarked[ end - 1 ] !== void 0
        && maskMarked[ end - 1 ] !== MARKER
      ) {
        return moveCursor.left(inp, limit, limit)
      }

      inp.setSelectionRange(selection ? start : end, end, 'forward')
    },

    leftReverse (inp, start, end, selection) {
      const
        localMaskMarked = getPaddedMaskMarked(inp.value.length)
      let i = Math.max(0, start - 1)

      for (; i >= 0; i--) {
        if (localMaskMarked[ i - 1 ] === MARKER) {
          start = i
          break
        }
        else if (localMaskMarked[ i ] === MARKER) {
          start = i
          if (i === 0) {
            break
          }
        }
      }

      if (
        i < 0
        && localMaskMarked[ start ] !== void 0
        && localMaskMarked[ start ] !== MARKER
      ) {
        return moveCursor.rightReverse(inp, 0, 0)
      }

      start >= 0 && inp.setSelectionRange(
        start,
        selection === true ? end : start, 'backward'
      )
    },

    rightReverse (inp, start, end, selection) {
      const
        limit = inp.value.length,
        localMaskMarked = getPaddedMaskMarked(limit),
        noMarkBefore = localMaskMarked.slice(0, end + 1).indexOf(MARKER) === -1
      let i = Math.min(limit, end + 1)

      for (; i <= limit; i++) {
        if (localMaskMarked[ i - 1 ] === MARKER) {
          end = i
          end > 0 && noMarkBefore === true && end--
          break
        }
      }

      if (
        i > limit
        && localMaskMarked[ end - 1 ] !== void 0
        && localMaskMarked[ end - 1 ] !== MARKER
      ) {
        return moveCursor.leftReverse(inp, limit, limit)
      }

      inp.setSelectionRange(selection === true ? start : end, end, 'forward')
    }
  }

  function onMaskedKeydown (e) {
    if (shouldIgnoreKey(e) === true) {
      return
    }

    const
      inp = inputRef.value,
      start = inp.selectionStart,
      end = inp.selectionEnd

    if (e.keyCode === 37 || e.keyCode === 39) { // Left / Right
      const fn = moveCursor[ (e.keyCode === 39 ? 'right' : 'left') + (props.reverseFillMask === true ? 'Reverse' : '') ]

      e.preventDefault()
      fn(inp, start, end, e.shiftKey)
    }
    else if (
      e.keyCode === 8 // Backspace
      && props.reverseFillMask !== true
      && start === end
    ) {
      moveCursor.left(inp, start, end, true)
    }
    else if (
      e.keyCode === 46 // Delete
      && props.reverseFillMask === true
      && start === end
    ) {
      moveCursor.rightReverse(inp, start, end, true)
    }
  }

  function maskValue (val) {
    if (val === void 0 || val === null || val === '') { return '' }

    if (props.reverseFillMask === true) {
      return maskValueReverse(val)
    }

    const mask = computedMask

    let valIndex = 0, output = ''

    for (let maskIndex = 0; maskIndex < mask.length; maskIndex++) {
      const
        valChar = val[ valIndex ],
        maskDef = mask[ maskIndex ]

      if (typeof maskDef === 'string') {
        output += maskDef
        valChar === maskDef && valIndex++
      }
      else if (valChar !== void 0 && maskDef.regex.test(valChar)) {
        output += maskDef.transform !== void 0
          ? maskDef.transform(valChar)
          : valChar
        valIndex++
      }
      else {
        return output
      }
    }

    return output
  }

  function maskValueReverse (val) {
    const
      mask = computedMask,
      firstTokenIndex = maskMarked.indexOf(MARKER)

    let valIndex = val.length - 1, output = ''

    for (let maskIndex = mask.length - 1; maskIndex >= 0 && valIndex > -1; maskIndex--) {
      const maskDef = mask[ maskIndex ]

      let valChar = val[ valIndex ]

      if (typeof maskDef === 'string') {
        output = maskDef + output
        valChar === maskDef && valIndex--
      }
      else if (valChar !== void 0 && maskDef.regex.test(valChar)) {
        do {
          output = (maskDef.transform !== void 0 ? maskDef.transform(valChar) : valChar) + output
          valIndex--
          valChar = val[ valIndex ]
        // eslint-disable-next-line no-unmodified-loop-condition
        } while (firstTokenIndex === maskIndex && valChar !== void 0 && maskDef.regex.test(valChar))
      }
      else {
        return output
      }
    }

    return output
  }

  function unmaskValue (val) {
    return typeof val !== 'string' || computedUnmask === void 0
      ? (typeof val === 'number' ? computedUnmask('' + val) : val)
      : computedUnmask(val)
  }

  function fillWithMask (val) {
    if (maskReplaced.length - val.length <= 0) {
      return val
    }

    return props.reverseFillMask === true && val.length > 0
      ? maskReplaced.slice(0, -val.length) + val
      : val + maskReplaced.slice(val.length)
  }

  return {
    innerValue,
    hasMask,
    moveCursorForPaste,
    updateMaskValue,
    onMaskedKeydown
  }
}
