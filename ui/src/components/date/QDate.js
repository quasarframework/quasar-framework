import { h, defineComponent, ref, computed, watch, Transition, nextTick, getCurrentInstance } from 'vue'

import QBtn from '../btn/QBtn.js'

import useDark, { useDarkProps } from '../../composables/private/use-dark.js'
import useCache from '../../composables/private/use-cache.js'
import { useFormProps, useFormAttrs, useFormInject } from '../../composables/private/use-form.js'
import useDatetime, { useDatetimeProps, useDatetimeEmits, getDayHash } from './use-datetime.js'

import { hSlot } from '../../utils/private/render.js'
import { formatDate, __splitDate, getDateDiff } from '../../utils/date.js'
import { pad } from '../../utils/format.js'
import { jalaaliMonthLength, toGregorian } from '../../utils/private/date-persian.js'
import { hijriMonthLength, hijriToGregorian } from '../../utils/private/date-hijri.js'

const yearsInterval = 20
const views = [ 'Calendar', 'Years', 'Months' ]
const viewIsValid = v => views.includes(v)
const yearMonthValidator = v => /^-?[\d]+\/[0-1]\d$/.test(v)
const lineStr = ' \u2014 '

function getMonthHash (date) {
  return date.year + '/' + pad(date.month)
}

export default defineComponent({
  name: 'QDate',

  props: {
    ...useDatetimeProps,
    ...useFormProps,
    ...useDarkProps,

    multiple: Boolean,
    range: Boolean,

    title: String,
    subtitle: String,

    mask: {
      // this mask is forced
      // when using persian calendar
      default: 'YYYY/MM/DD'
    },

    defaultYearMonth: {
      type: String,
      validator: yearMonthValidator
    },

    yearsInMonthView: Boolean,

    events: [ Array, Function ],
    eventColor: [ String, Function ],

    emitImmediately: Boolean,

    options: [ Array, Function ],

    navigationMinYearMonth: {
      type: String,
      validator: yearMonthValidator
    },

    navigationMaxYearMonth: {
      type: String,
      validator: yearMonthValidator
    },

    noUnset: Boolean,

    firstDayOfWeek: [ String, Number ],
    todayBtn: Boolean,
    minimal: Boolean,
    defaultView: {
      type: String,
      default: 'Calendar',
      validator: viewIsValid
    }
  },

  emits: [
    ...useDatetimeEmits,
    'range-start', 'range-end', 'navigation'
  ],

  setup (props, { slots, emit }) {
    const { proxy } = getCurrentInstance()
    const { $q } = proxy

    const isDark = useDark(props, $q)
    const { getCache } = useCache()
    const { tabindex, headerClass, getLocale, getCurrentDate } = useDatetime(props, $q)

    let lastEmitValue

    const formAttrs = useFormAttrs(props)
    const injectFormInput = useFormInject(formAttrs)

    const blurTargetRef = ref(null)
    const innerMask = ref(getMask())
    const innerLocale = ref(getLocale())

    const mask = computed(() => getMask())
    const locale = computed(() => getLocale())

    const today = computed(() => getCurrentDate())

    // model of current calendar view:
    const viewModel = ref(getViewModel(innerMask.value, innerLocale.value))

    const view = ref(props.defaultView)

    const direction = $q.lang.rtl === true ? 'right' : 'left'
    const monthDirection = ref(direction.value)
    const yearDirection = ref(direction.value)

    const year = viewModel.value.year
    const startYear = ref(year - (year % yearsInterval) - (year < 0 ? yearsInterval : 0))
    const editRange = ref(null)

    const classes = computed(() => {
      const type = props.landscape === true ? 'landscape' : 'portrait'
      return `q-date q-date--${ type } q-date--${ type }-${ props.minimal === true ? 'minimal' : 'standard' }`
        + (isDark.value === true ? ' q-date--dark q-dark' : '')
        + (props.bordered === true ? ' q-date--bordered' : '')
        + (props.square === true ? ' q-date--square no-border-radius' : '')
        + (props.flat === true ? ' q-date--flat no-shadow' : '')
        + (props.disable === true ? ' disabled' : (props.readonly === true ? ' q-date--readonly' : ''))
    })

    const computedColor = computed(() => {
      return props.color || 'primary'
    })

    const computedTextColor = computed(() => {
      return props.textColor || 'white'
    })

    const isImmediate = computed(() =>
      props.emitImmediately === true
      && props.multiple !== true
      && props.range !== true
    )

    const normalizedModel = computed(() => (
      Array.isArray(props.modelValue) === true
        ? props.modelValue
        : (props.modelValue !== null && props.modelValue !== void 0 ? [ props.modelValue ] : [])
    ))

    const daysModel = computed(() =>
      normalizedModel.value
        .filter(date => typeof date === 'string')
        .map(date => decodeString(date, innerMask.value, innerLocale.value))
        .filter(date => date.dateHash !== null)
    )

    const rangeModel = computed(() => {
      const fn = date => decodeString(date, innerMask.value, innerLocale.value)
      return normalizedModel.value
        .filter(date => Object(date) === date && date.from !== void 0 && date.to !== void 0)
        .map(range => ({ from: fn(range.from), to: fn(range.to) }))
        .filter(range => range.from.dateHash !== null && range.to.dateHash !== null && range.from.dateHash < range.to.dateHash)
    })

    const getNativeDateFn = computed(() => {
      if (props.calendar === 'persian') {
        return model => {
          const gDate = toGregorian(model.year, model.month, model.day)
          return new Date(gDate.gy, gDate.gm - 1, gDate.gd)
        }
      }
      else if (props.calendar === 'islamic') {
        return model => {
          const gDate = hijriToGregorian(model.year, model.month, model.day)
          return new Date(gDate.gy, gDate.gm - 1, gDate.gd)
        }
      }
      else {
        return model => new Date(model.year, model.month - 1, model.day)
      }
    })

    const encodeObjectFn = computed(() => {
      if (props.calendar === 'persian') {
        return getDayHash
      }
      else if (props.calendar === 'islamic') {
        return getDayHash
      }
      else {
        return (date, mask, locale) => formatDate(
          new Date(
            date.year,
            date.month - 1,
            date.day,
            date.hour,
            date.minute,
            date.second,
            date.millisecond
          ),
          mask === void 0 ? innerMask.value : mask,
          locale === void 0 ? innerLocale.value : locale,
          date.year,
          date.timezoneOffset
        )
      }
    })

    const daysInModel = computed(() =>
      daysModel.value.length + rangeModel.value.reduce(
        (acc, range) => acc + 1 + getDateDiff(
          getNativeDateFn.value(range.to),
          getNativeDateFn.value(range.from)
        ),
        0
      )
    )

    const headerTitle = computed(() => {
      if (props.title !== void 0 && props.title !== null && props.title.length > 0) {
        return props.title
      }

      if (editRange.value !== null) {
        const model = editRange.value.init
        const date = getNativeDateFn.value(model)

        return innerLocale.value.daysShort[ date.getDay() ] + ', '
          + innerLocale.value.monthsShort[ model.month - 1 ] + ' '
          + model.day + lineStr + '?'
      }

      if (daysInModel.value === 0) {
        return lineStr
      }

      if (daysInModel.value > 1) {
        return `${ daysInModel.value } ${ innerLocale.value.pluralDay }`
      }

      const model = daysModel.value[ 0 ]
      const date = getNativeDateFn.value(model)

      if (isNaN(date.valueOf()) === true) {
        return lineStr
      }

      if (innerLocale.value.headerTitle !== void 0) {
        return innerLocale.value.headerTitle(date, model)
      }

      return innerLocale.value.daysShort[ date.getDay() ] + ', '
        + innerLocale.value.monthsShort[ model.month - 1 ] + ' '
        + model.day
    })

    const minSelectedModel = computed(() => {
      const model = daysModel.value.concat(rangeModel.value.map(range => range.from))
        .sort((a, b) => a.year - b.year || a.month - b.month)

      return model[ 0 ]
    })

    const maxSelectedModel = computed(() => {
      const model = daysModel.value.concat(rangeModel.value.map(range => range.to))
        .sort((a, b) => b.year - a.year || b.month - a.month)

      return model[ 0 ]
    })

    const headerSubtitle = computed(() => {
      if (props.subtitle !== void 0 && props.subtitle !== null && props.subtitle.length > 0) {
        return props.subtitle
      }

      if (daysInModel.value === 0) {
        return lineStr
      }

      if (daysInModel.value > 1) {
        const from = minSelectedModel.value
        const to = maxSelectedModel.value
        const month = innerLocale.value.monthsShort

        return month[ from.month - 1 ] + (
          from.year !== to.year
            ? ' ' + from.year + lineStr + month[ to.month - 1 ] + ' '
            : (
                from.month !== to.month
                  ? lineStr + month[ to.month - 1 ]
                  : ''
              )
        ) + ' ' + to.year
      }

      return daysModel.value[ 0 ].year
    })

    const dateArrow = computed(() => {
      const val = [ $q.iconSet.datetime.arrowLeft, $q.iconSet.datetime.arrowRight ]
      return $q.lang.rtl === true ? val.reverse() : val
    })

    const computedFirstDayOfWeek = computed(() => (
      props.firstDayOfWeek !== void 0
        ? Number(props.firstDayOfWeek)
        : innerLocale.value.firstDayOfWeek
    ))

    const daysOfWeek = computed(() => {
      const
        days = innerLocale.value.daysShort,
        first = computedFirstDayOfWeek.value

      return first > 0
        ? days.slice(first, 7).concat(days.slice(0, first))
        : days
    })

    const daysInMonth = computed(() => {
      const date = viewModel.value
      if (props.calendar === 'persian') {
        return jalaaliMonthLength(date.year, date.month)
      }
      else if (props.calendar === 'islamic') {
        return hijriMonthLength(date.year, date.month)
      }
      else {
        return (new Date(date.year, date.month, 0)).getDate()
      }
    })

    const evtColor = computed(() => (
      typeof props.eventColor === 'function'
        ? props.eventColor
        : () => props.eventColor
    ))

    const minNav = computed(() => {
      if (props.navigationMinYearMonth === void 0) {
        return null
      }

      const data = props.navigationMinYearMonth.split('/')
      return { year: parseInt(data[ 0 ], 10), month: parseInt(data[ 1 ], 10) }
    })

    const maxNav = computed(() => {
      if (props.navigationMaxYearMonth === void 0) {
        return null
      }

      const data = props.navigationMaxYearMonth.split('/')
      return { year: parseInt(data[ 0 ], 10), month: parseInt(data[ 1 ], 10) }
    })

    const navBoundaries = computed(() => {
      const data = {
        month: { prev: true, next: true },
        year: { prev: true, next: true }
      }

      if (minNav.value !== null && minNav.value.year >= viewModel.value.year) {
        data.year.prev = false
        if (minNav.value.year === viewModel.value.year && minNav.value.month >= viewModel.value.month) {
          data.month.prev = false
        }
      }

      if (maxNav.value !== null && maxNav.value.year <= viewModel.value.year) {
        data.year.next = false
        if (maxNav.value.year === viewModel.value.year && maxNav.value.month <= viewModel.value.month) {
          data.month.next = false
        }
      }

      return data
    })

    const daysMap = computed(() => {
      const map = {}

      daysModel.value.forEach(entry => {
        const hash = getMonthHash(entry)

        if (map[ hash ] === void 0) {
          map[ hash ] = []
        }

        map[ hash ].push(entry.day)
      })

      return map
    })

    const rangeMap = computed(() => {
      const map = {}

      rangeModel.value.forEach(entry => {
        const hashFrom = getMonthHash(entry.from)
        const hashTo = getMonthHash(entry.to)

        if (map[ hashFrom ] === void 0) {
          map[ hashFrom ] = []
        }

        map[ hashFrom ].push({
          from: entry.from.day,
          to: hashFrom === hashTo ? entry.to.day : void 0,
          range: entry
        })

        if (hashFrom < hashTo) {
          let hash
          const { year, month } = entry.from
          const cur = month < 12
            ? { year, month: month + 1 }
            : { year: year + 1, month: 1 }

          while ((hash = getMonthHash(cur)) <= hashTo) {
            if (map[ hash ] === void 0) {
              map[ hash ] = []
            }

            map[ hash ].push({
              from: void 0,
              to: hash === hashTo ? entry.to.day : void 0,
              range: entry
            })

            cur.month++
            if (cur.month > 12) {
              cur.year++
              cur.month = 1
            }
          }
        }
      })

      return map
    })

    const rangeView = computed(() => {
      if (editRange.value === null) {
        return
      }

      const { init, initHash, final, finalHash } = editRange.value

      const [ from, to ] = initHash <= finalHash
        ? [ init, final ]
        : [ final, init ]

      const fromHash = getMonthHash(from)
      const toHash = getMonthHash(to)

      if (fromHash !== viewMonthHash.value && toHash !== viewMonthHash.value) {
        return
      }

      const view = {}

      if (fromHash === viewMonthHash.value) {
        view.from = from.day
        view.includeFrom = true
      }
      else {
        view.from = 1
      }

      if (toHash === viewMonthHash.value) {
        view.to = to.day
        view.includeTo = true
      }
      else {
        view.to = daysInMonth.value
      }

      return view
    })

    const viewMonthHash = computed(() => getMonthHash(viewModel.value))

    const selectionDaysMap = computed(() => {
      const map = {}

      if (props.options === void 0) {
        for (let i = 1; i <= daysInMonth.value; i++) {
          map[ i ] = true
        }

        return map
      }

      const fn = typeof props.options === 'function'
        ? props.options
        : date => props.options.includes(date)

      for (let i = 1; i <= daysInMonth.value; i++) {
        const dayHash = viewMonthHash.value + '/' + pad(i)
        map[ i ] = fn(dayHash)
      }

      return map
    })

    const eventDaysMap = computed(() => {
      const map = {}

      if (props.events === void 0) {
        for (let i = 1; i <= daysInMonth.value; i++) {
          map[ i ] = false
        }
      }
      else {
        const fn = typeof props.events === 'function'
          ? props.events
          : date => props.events.includes(date)

        for (let i = 1; i <= daysInMonth.value; i++) {
          const dayHash = viewMonthHash.value + '/' + pad(i)
          map[ i ] = fn(dayHash) === true && evtColor.value(dayHash)
        }
      }

      return map
    })

    const viewDays = computed(() => {
      let date, endDay
      const { year, month } = viewModel.value

      if (props.calendar === 'persian') {
        const gDate = toGregorian(year, month, 1)
        date = new Date(gDate.gy, gDate.gm - 1, gDate.gd)
        let prevJM = month - 1
        let prevJY = year
        if (prevJM === 0) {
          prevJM = 12
          prevJY--
        }
        endDay = jalaaliMonthLength(prevJY, prevJM)
      }
      else if (props.calendar === 'islamic') {
        const gDate = hijriToGregorian(year, month, 1)
        date = new Date(gDate.gy, gDate.gm - 1, gDate.gd)
        let prevIM = month - 1
        let prevIY = year
        if (prevIM === 0) {
          prevIM = 12
          prevIY--
        }
        endDay = hijriMonthLength(prevIY, prevIM)
      }
      else {
        date = new Date(year, month - 1, 1)
        endDay = (new Date(year, month - 1, 0)).getDate()
      }

      return {
        days: date.getDay() - computedFirstDayOfWeek.value - 1,
        endDay
      }
    })

    const days = computed(() => {
      const res = []
      const { days, endDay } = viewDays.value

      const len = days < 0 ? days + 7 : days
      if (len < 6) {
        for (let i = endDay - len; i <= endDay; i++) {
          res.push({ i, fill: true })
        }
      }

      const index = res.length

      for (let i = 1; i <= daysInMonth.value; i++) {
        const day = { i, event: eventDaysMap.value[ i ], classes: [] }

        if (selectionDaysMap.value[ i ] === true) {
          day.in = true
          day.flat = true
        }

        res.push(day)
      }

      // if current view has days in model
      if (daysMap.value[ viewMonthHash.value ] !== void 0) {
        daysMap.value[ viewMonthHash.value ].forEach(day => {
          const i = index + day - 1
          Object.assign(res[ i ], {
            selected: true,
            unelevated: true,
            flat: false,
            color: computedColor.value,
            textColor: computedTextColor.value
          })
        })
      }

      // if current view has ranges in model
      if (rangeMap.value[ viewMonthHash.value ] !== void 0) {
        rangeMap.value[ viewMonthHash.value ].forEach(entry => {
          if (entry.from !== void 0) {
            const from = index + entry.from - 1
            const to = index + (entry.to || daysInMonth.value) - 1

            for (let day = from; day <= to; day++) {
              Object.assign(res[ day ], {
                range: entry.range,
                unelevated: true,
                color: computedColor.value,
                textColor: computedTextColor.value
              })
            }

            Object.assign(res[ from ], {
              rangeFrom: true,
              flat: false
            })

            entry.to !== void 0 && Object.assign(res[ to ], {
              rangeTo: true,
              flat: false
            })
          }
          else if (entry.to !== void 0) {
            const to = index + entry.to - 1

            for (let day = index; day <= to; day++) {
              Object.assign(res[ day ], {
                range: entry.range,
                unelevated: true,
                color: computedColor.value,
                textColor: computedTextColor.value
              })
            }

            Object.assign(res[ to ], {
              flat: false,
              rangeTo: true
            })
          }
          else {
            const to = index + daysInMonth.value - 1
            for (let day = index; day <= to; day++) {
              Object.assign(res[ day ], {
                range: entry.range,
                unelevated: true,
                color: computedColor.value,
                textColor: computedTextColor.value
              })
            }
          }
        })
      }

      if (rangeView.value !== void 0) {
        const from = index + rangeView.value.from - 1
        const to = index + rangeView.value.to - 1

        for (let day = from; day <= to; day++) {
          res[ day ].color = computedColor.value
          res[ day ].editRange = true
        }

        if (rangeView.value.includeFrom === true) {
          res[ from ].editRangeFrom = true
        }
        if (rangeView.value.includeTo === true) {
          res[ to ].editRangeTo = true
        }
      }

      if (viewModel.value.year === today.value.year && viewModel.value.month === today.value.month) {
        res[ index + today.value.day - 1 ].today = true
      }

      const left = res.length % 7
      if (left > 0) {
        const afterDays = 7 - left
        for (let i = 1; i <= afterDays; i++) {
          res.push({ i, fill: true })
        }
      }

      res.forEach(day => {
        let cls = 'q-date__calendar-item '

        if (day.fill === true) {
          cls += 'q-date__calendar-item--fill'
        }
        else {
          cls += `q-date__calendar-item--${ day.in === true ? 'in' : 'out' }`

          if (day.range !== void 0) {
            cls += ` q-date__range${ day.rangeTo === true ? '-to' : (day.rangeFrom === true ? '-from' : '') }`
          }

          if (day.editRange === true) {
            cls += ` q-date__edit-range${ day.editRangeFrom === true ? '-from' : '' }${ day.editRangeTo === true ? '-to' : '' }`
          }

          if (day.range !== void 0 || day.editRange === true) {
            cls += ` text-${ day.color }`
          }
        }

        day.classes = cls
      })

      return res
    })

    const attributes = computed(() => (
      props.disable === true
        ? { 'aria-disabled': 'true' }
        : (props.readonly === true ? { 'aria-readonly': 'true' } : {})
    ))

    watch(() => props.modelValue, v => {
      if (lastEmitValue === v) {
        lastEmitValue = 0
      }
      else {
        const { year, month } = getViewModel(innerMask.value, innerLocale.value)
        updateViewModel(year, month)
      }
    })

    watch(view, () => {
      blurTargetRef.value !== null && blurTargetRef.value.focus()
    })

    watch(() => viewModel.value.year, year => {
      emit('navigation', { year, month: viewModel.value.month })
    })

    watch(() => viewModel.value.month, month => {
      emit('navigation', { year: viewModel.value.year, month })
    })

    watch(mask, val => {
      updateValue(val, innerLocale.value, 'mask')
      innerMask.value = val
    })

    watch(locale, val => {
      updateValue(innerMask.value, val, 'locale')
      innerLocale.value = val
    })

    function setToday () {
      toggleDate(today.value, getMonthHash(today.value))
      setCalendarTo(today.value.year, today.value.month)
    }

    function setView (viewMode) {
      if (viewIsValid(viewMode) === true) {
        view.value = viewMode
      }
    }

    function offsetCalendar (type, descending) {
      if ([ 'month', 'year' ].includes(type)) {
        const fn = type === 'month' ? goToMonth : goToYear
        fn(descending === true ? -1 : 1)
      }
    }

    function setCalendarTo (year, month) {
      view.value = 'Calendar'
      updateViewModel(year, month)
    }

    function setEditingRange (from, to) {
      if (props.range === false || !from) {
        editRange.value = null
        return
      }

      const init = Object.assign({ ...viewModel.value }, from)
      const final = to !== void 0
        ? Object.assign({ ...viewModel.value }, to)
        : init

      editRange.value = {
        init,
        initHash: getDayHash(init),
        final,
        finalHash: getDayHash(final)
      }

      setCalendarTo(init.year, init.month)
    }

    function getMask () {
      return (props.calendar === 'persian' || props.calendar === 'islamic') ? 'YYYY/MM/DD' : props.mask
    }

    function decodeString (date, mask, locale) {
      return __splitDate(
        date,
        mask,
        locale,
        props.calendar,
        {
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        }
      )
    }

    function getViewModel (mask, locale) {
      const model = Array.isArray(props.modelValue) === true
        ? props.modelValue
        : (props.modelValue ? [ props.modelValue ] : [])

      if (model.length === 0) {
        return getDefaultViewModel()
      }

      const decoded = decodeString(
        model[ 0 ].from !== void 0 ? model[ 0 ].from : model[ 0 ],
        mask,
        locale
      )

      return decoded.dateHash === null
        ? getDefaultViewModel()
        : decoded
    }

    function getDefaultViewModel () {
      let year, month

      if (props.defaultYearMonth !== void 0) {
        const d = props.defaultYearMonth.split('/')
        year = parseInt(d[ 0 ], 10)
        month = parseInt(d[ 1 ], 10)
      }
      else {
        // may come from data() where computed
        // props are not yet available
        const d = today.value !== void 0
          ? today.value
          : getCurrentDate()

        year = d.year
        month = d.month
      }

      return {
        year,
        month,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        dateHash: year + '/' + pad(month) + '/01'
      }
    }

    function goToMonth (offset) {
      let year = viewModel.value.year
      let month = Number(viewModel.value.month) + offset

      if (month === 13) {
        month = 1
        year++
      }
      else if (month === 0) {
        month = 12
        year--
      }

      updateViewModel(year, month)
      isImmediate.value === true && emitImmediately('month')
    }

    function goToYear (offset) {
      const year = Number(viewModel.value.year) + offset
      updateViewModel(year, viewModel.value.month)
      isImmediate.value === true && emitImmediately('year')
    }

    function setYear (year) {
      updateViewModel(year, viewModel.value.month)
      view.value = props.defaultView === 'Years' ? 'Months' : 'Calendar'
      isImmediate.value === true && emitImmediately('year')
    }

    function setMonth (month) {
      updateViewModel(viewModel.value.year, month)
      view.value = 'Calendar'
      isImmediate.value === true && emitImmediately('month')
    }

    function toggleDate (date, monthHash) {
      const month = daysMap.value[ monthHash ]
      const fn = month !== void 0 && month.includes(date.day) === true
        ? removeFromModel
        : addToModel

      fn(date)
    }

    function getShortDate (date) {
      return { year: date.year, month: date.month, day: date.day }
    }

    function updateViewModel (year, month) {
      if (minNav.value !== null && year <= minNav.value.year) {
        year = minNav.value.year
        if (month < minNav.value.month) {
          month = minNav.value.month
        }
      }

      if (maxNav.value !== null && year >= maxNav.value.year) {
        year = maxNav.value.year
        if (month > maxNav.value.month) {
          month = maxNav.value.month
        }
      }

      const newHash = year + '/' + pad(month) + '/01'

      if (newHash !== viewModel.value.dateHash) {
        monthDirection.value = (viewModel.value.dateHash < newHash) === ($q.lang.rtl !== true) ? 'left' : 'right'
        if (year !== viewModel.value.year) {
          yearDirection.value = monthDirection.value
        }

        nextTick(() => {
          startYear.value = year - year % yearsInterval - (year < 0 ? yearsInterval : 0)
          Object.assign(viewModel.value, {
            year,
            month,
            day: 1,
            dateHash: newHash
          })
        })
      }
    }

    function emitValue (val, action, date) {
      const value = val !== null && val.length === 1 && props.multiple === false
        ? val[ 0 ]
        : val

      lastEmitValue = value

      const { reason, details } = getEmitParams(action, date)
      emit('update:modelValue', value, reason, details)
    }

    function emitImmediately (reason) {
      const date = daysModel.value[ 0 ] !== void 0 && daysModel.value[ 0 ].dateHash !== null
        ? { ...daysModel.value[ 0 ] }
        : { ...viewModel.value } // inherit day, hours, minutes, milliseconds...

      // nextTick required because of animation delay in viewModel
      nextTick(() => {
        date.year = viewModel.value.year
        date.month = viewModel.value.month

        const maxDay = props.calendar === 'persian'
          ? jalaaliMonthLength(date.year, date.month)
          : (
              props.calendar === 'islamic'
                ? hijriMonthLength(date.year, date.month)
                : (new Date(date.year, date.month, 0)).getDate()
            )

        date.day = Math.min(Math.max(1, date.day), maxDay)

        const value = encodeEntry(date)
        lastEmitValue = value

        const { details } = getEmitParams('', date)
        emit('update:modelValue', value, reason, details)
      })
    }

    function getEmitParams (action, date) {
      return date.from !== void 0
        ? {
            reason: `${ action }-range`,
            details: {
              ...getShortDate(date.target),
              from: getShortDate(date.from),
              to: getShortDate(date.to)
            }
          }
        : {
            reason: `${ action }-day`,
            details: getShortDate(date)
          }
    }

    function encodeEntry (date, mask, locale) {
      return date.from !== void 0
        ? { from: encodeObjectFn.value(date.from, mask, locale), to: encodeObjectFn.value(date.to, mask, locale) }
        : encodeObjectFn.value(date, mask, locale)
    }

    function addToModel (date) {
      let value

      if (props.multiple === true) {
        if (date.from !== void 0) {
          // we also need to filter out intersections

          const fromHash = getDayHash(date.from)
          const toHash = getDayHash(date.to)

          const days = daysModel.value
            .filter(day => day.dateHash < fromHash || day.dateHash > toHash)

          const ranges = rangeModel.value
            .filter(({ from, to }) => to.dateHash < fromHash || from.dateHash > toHash)

          value = days.concat(ranges).concat(date).map(entry => encodeEntry(entry))
        }
        else {
          const model = normalizedModel.value.slice()
          model.push(encodeEntry(date))
          value = model
        }
      }
      else {
        value = encodeEntry(date)
      }

      emitValue(value, 'add', date)
    }

    function removeFromModel (date) {
      if (props.noUnset === true) {
        return
      }

      let model = null

      if (props.multiple === true && Array.isArray(props.modelValue) === true) {
        const val = encodeEntry(date)

        if (date.from !== void 0) {
          model = props.modelValue.filter(
            date => (
              date.from !== void 0
                ? (date.from !== val.from && date.to !== val.to)
                : true
            )
          )
        }
        else {
          model = props.modelValue.filter(date => date !== val)
        }

        if (model.length === 0) {
          model = null
        }
      }

      emitValue(model, 'remove', date)
    }

    function updateValue (mask, locale, reason) {
      const model = daysModel.value
        .concat(rangeModel.value)
        .map(entry => encodeEntry(entry, mask, locale))
        .filter(entry => {
          return entry.from !== void 0
            ? entry.from.dateHash !== null && entry.to.dateHash !== null
            : entry.dateHash !== null
        })

      emit('update:modelValue', (props.multiple === true ? model : model[ 0 ]) || null, reason)
    }

    // expose public methods
    Object.assign(proxy, {
      setToday, setView, offsetCalendar, setCalendarTo, setEditingRange
    })

    function getHeader () {
      if (props.minimal === true) { return }

      return h('div', {
        class: 'q-date__header ' + headerClass.value
      }, [
        h('div', {
          class: 'relative-position'
        }, [
          h(Transition, {
            name: 'q-transition--fade'
          }, () => h('div', {
            key: 'h-yr-' + headerSubtitle.value,
            class: 'q-date__header-subtitle q-date__header-link '
              + (view.value === 'Years' ? 'q-date__header-link--active' : 'cursor-pointer'),
            tabindex: tabindex.value,
            ...getCache('vY', {
              onClick () { view.value = 'Years' },
              onKeyup (e) { e.keyCode === 13 && (view.value = 'Years') }
            })
          }, [ headerSubtitle.value ]))
        ]),

        h('div', {
          class: 'q-date__header-title relative-position flex no-wrap'
        }, [
          h('div', {
            class: 'relative-position col'
          }, [
            h(Transition, {
              name: 'q-transition--fade'
            }, () => h('div', {
              key: 'h-sub' + headerTitle.value,
              class: 'q-date__header-title-label q-date__header-link '
                + (view.value === 'Calendar' ? 'q-date__header-link--active' : 'cursor-pointer'),
              tabindex: tabindex.value,
              ...getCache('vC', {
                onClick () { view.value = 'Calendar' },
                onKeyup (e) { e.keyCode === 13 && (view.value = 'Calendar') }
              })
            }, [ headerTitle.value ]))
          ]),

          props.todayBtn === true ? h(QBtn, {
            class: 'q-date__header-today self-start',
            icon: $q.iconSet.datetime.today,
            flat: true,
            size: 'sm',
            round: true,
            tabindex: tabindex.value,
            onClick: setToday
          }) : null
        ])
      ])
    }

    function getNavigation ({ label, type, key, dir, goTo, boundaries, cls }) {
      return [
        h('div', {
          class: 'row items-center q-date__arrow'
        }, [
          h(QBtn, {
            round: true,
            dense: true,
            size: 'sm',
            flat: true,
            icon: dateArrow.value[ 0 ],
            tabindex: tabindex.value,
            disable: boundaries.prev === false,
            ...getCache('go-#' + type, { onClick () { goTo(-1) } })
          })
        ]),

        h('div', {
          class: 'relative-position overflow-hidden flex flex-center' + cls
        }, [
          h(Transition, {
            name: 'q-transition--jump-' + dir
          }, () => h('div', { key }, [
            h(QBtn, {
              flat: true,
              dense: true,
              noCaps: true,
              label,
              tabindex: tabindex.value,
              ...getCache('view#' + type, { onClick: () => { view.value = type } })
            })
          ]))
        ]),

        h('div', {
          class: 'row items-center q-date__arrow'
        }, [
          h(QBtn, {
            round: true,
            dense: true,
            size: 'sm',
            flat: true,
            icon: dateArrow.value[ 1 ],
            tabindex: tabindex.value,
            disable: boundaries.next === false,
            ...getCache('go+#' + type, { onClick () { goTo(1) } })
          })
        ])
      ]
    }

    const renderViews = {
      Calendar: () => ([
        h('div', {
          key: 'calendar-view',
          class: 'q-date__view q-date__calendar'
        }, [
          h('div', {
            class: 'q-date__navigation row items-center no-wrap'
          }, getNavigation({
            label: innerLocale.value.months[ viewModel.value.month - 1 ],
            type: 'Months',
            key: viewModel.value.month,
            dir: monthDirection.value,
            goTo: goToMonth,
            boundaries: navBoundaries.value.month,
            cls: ' col'
          }).concat(getNavigation({
            label: viewModel.value.year,
            type: 'Years',
            key: viewModel.value.year,
            dir: yearDirection.value,
            goTo: goToYear,
            boundaries: navBoundaries.value.year,
            cls: ''
          }))),

          h('div', {
            class: 'q-date__calendar-weekdays row items-center no-wrap'
          }, daysOfWeek.value.map(day => h('div', { class: 'q-date__calendar-item' }, [ h('div', day) ]))),

          h('div', {
            class: 'q-date__calendar-days-container relative-position overflow-hidden'
          }, [
            h(Transition, {
              name: 'q-transition--slide-' + monthDirection.value
            }, () => h('div', {
              key: viewMonthHash.value,
              class: 'q-date__calendar-days fit'
            }, days.value.map(day => h('div', { class: day.classes }, [
              day.in === true
                ? h(
                  QBtn, {
                    class: day.today === true ? 'q-date__today' : '',
                    dense: true,
                    flat: day.flat,
                    unelevated: day.unelevated,
                    color: day.color,
                    textColor: day.textColor,
                    label: day.i,
                    tabindex: tabindex.value,
                    ...getCache('day#' + day.i, {
                      onClick: () => { onDayClick(day.i) },
                      onMouseover: () => { onDayMouseover(day.i) }
                    })
                  },
                  day.event !== false
                    ? () => h('div', { class: 'q-date__event bg-' + day.event })
                    : null
                )
                : h('div', '' + day.i)
            ]))))
          ])
        ])
      ]),

      Months () {
        const currentYear = viewModel.value.year === today.value.year
        const isDisabled = month => {
          return (
            (minNav.value !== null && viewModel.value.year === minNav.value.year && minNav.value.month > month)
            || (maxNav.value !== null && viewModel.value.year === maxNav.value.year && maxNav.value.month < month)
          )
        }

        const content = innerLocale.value.monthsShort.map((month, i) => {
          const active = viewModel.value.month === i + 1

          return h('div', {
            class: 'q-date__months-item flex flex-center'
          }, [
            h(QBtn, {
              class: currentYear === true && today.value.month === i + 1 ? 'q-date__today' : null,
              flat: active !== true,
              label: month,
              unelevated: active,
              color: active === true ? computedColor.value : null,
              textColor: active === true ? computedTextColor.value : null,
              tabindex: tabindex.value,
              disable: isDisabled(i + 1),
              ...getCache('month#' + i, { onClick: () => { setMonth(i + 1) } })
            })
          ])
        })

        props.yearsInMonthView === true && content.unshift(
          h('div', { class: 'row no-wrap full-width' }, [
            getNavigation({
              label: viewModel.value.year,
              type: 'Years',
              key: viewModel.value.year,
              dir: yearDirection.value,
              goTo: goToYear,
              boundaries: navBoundaries.value.year,
              cls: ' col'
            })
          ])
        )

        return h('div', {
          key: 'months-view',
          class: 'q-date__view q-date__months flex flex-center'
        }, content)
      },

      Years () {
        const
          start = startYear.value,
          stop = start + yearsInterval,
          years = []

        const isDisabled = year => {
          return (
            (minNav.value !== null && minNav.value.year > year)
            || (maxNav.value !== null && maxNav.value.year < year)
          )
        }

        for (let i = start; i <= stop; i++) {
          const active = viewModel.value.year === i

          years.push(
            h('div', {
              class: 'q-date__years-item flex flex-center'
            }, [
              h(QBtn, {
                key: 'yr' + i,
                class: today.value.year === i ? 'q-date__today' : null,
                flat: !active,
                label: i,
                dense: true,
                unelevated: active,
                color: active === true ? computedColor.value : null,
                textColor: active === true ? computedTextColor.value : null,
                tabindex: tabindex.value,
                disable: isDisabled(i),
                ...getCache('yr#' + i, { onClick: () => { setYear(i) } })
              })
            ])
          )
        }

        return h('div', {
          class: 'q-date__view q-date__years flex flex-center'
        }, [
          h('div', {
            class: 'col-auto'
          }, [
            h(QBtn, {
              round: true,
              dense: true,
              flat: true,
              icon: dateArrow.value[ 0 ],
              tabindex: tabindex.value,
              disable: isDisabled(start),
              ...getCache('y-', { onClick: () => { startYear.value -= yearsInterval } })
            })
          ]),

          h('div', {
            class: 'q-date__years-content col self-stretch row items-center'
          }, years),

          h('div', {
            class: 'col-auto'
          }, [
            h(QBtn, {
              round: true,
              dense: true,
              flat: true,
              icon: dateArrow.value[ 1 ],
              tabindex: tabindex.value,
              disable: isDisabled(stop),
              ...getCache('y+', { onClick: () => { startYear.value += yearsInterval } })
            })
          ])
        ])
      }
    }

    function onDayClick (dayIndex) {
      const day = { ...viewModel.value, day: dayIndex }

      if (props.range === false) {
        toggleDate(day, viewMonthHash.value)
        return
      }

      if (editRange.value === null) {
        const dayProps = days.value.find(day => day.fill !== true && day.i === dayIndex)

        if (dayProps.range !== void 0) {
          removeFromModel({ target: day, from: dayProps.range.from, to: dayProps.range.to })
          return
        }

        if (dayProps.selected === true) {
          removeFromModel(day)
          return
        }

        const initHash = getDayHash(day)

        editRange.value = {
          init: day,
          initHash,
          final: day,
          finalHash: initHash
        }

        emit('range-start', getShortDate(day))
      }
      else {
        const
          initHash = editRange.value.initHash,
          finalHash = getDayHash(day),
          payload = initHash <= finalHash
            ? { from: editRange.value.init, to: day }
            : { from: day, to: editRange.value.init }

        editRange.value = null
        addToModel(initHash === finalHash ? day : { target: day, ...payload })

        emit('range-end', {
          from: getShortDate(payload.from),
          to: getShortDate(payload.to)
        })
      }
    }

    function onDayMouseover (dayIndex) {
      if (editRange.value !== null) {
        const final = { ...viewModel.value, day: dayIndex }

        Object.assign(editRange.value, {
          final,
          finalHash: getDayHash(final)
        })
      }
    }

    return () => {
      const content = [
        h('div', {
          class: 'q-date__content col relative-position'
        }, [
          h(Transition, {
            name: 'q-transition--fade'
          }, renderViews[ view.value ])
        ])
      ]

      const def = hSlot(slots.default)
      def !== void 0 && content.push(
        h('div', { class: 'q-date__actions' }, def)
      )

      if (props.name !== void 0 && props.disable !== true) {
        injectFormInput(content, 'push')
      }

      return h('div', {
        class: classes.value,
        ...attributes.value
      }, [
        getHeader(),

        h('div', {
          ref: blurTargetRef,
          class: 'q-date__main col column',
          tabindex: -1
        }, content)
      ])
    }
  }
})
