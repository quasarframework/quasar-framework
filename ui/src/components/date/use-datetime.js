import { computed } from 'vue'

import { toJalaali } from '../../utils/private/date-persian.js'
import { GregorianToHijri } from '../../utils/private/date-hijri.js'
import { pad } from '../../utils/format.js'

const calendars = [ 'gregorian', 'persian', 'islamic' ]

export const useDatetimeProps = {
  modelValue: {
    required: true
  },

  mask: {
    type: String
  },
  locale: Object,

  calendar: {
    type: String,
    validator: v => calendars.includes(v),
    default: 'gregorian'
  },

  landscape: Boolean,

  color: String,
  textColor: String,

  square: Boolean,
  flat: Boolean,
  bordered: Boolean,

  readonly: Boolean,
  disable: Boolean
}

export const useDatetimeEmits = [ 'update:modelValue' ]

export function getDayHash (date) {
  return date.year + '/' + pad(date.month) + '/' + pad(date.day)
}

export default function (props, $q) {
  const editable = computed(() => {
    return props.disable !== true && props.readonly !== true
  })

  const tabindex = computed(() => {
    return props.editable === true ? 0 : -1
  })

  const headerClass = computed(() => {
    const cls = []
    props.color !== void 0 && cls.push(`bg-${ props.color }`)
    props.textColor !== void 0 && cls.push(`text-${ props.textColor }`)
    return cls.join(' ')
  })

  function getLocale () {
    return props.locale || $q.lang.date
  }

  function getCurrentDate (dateOnly) {
    const d = new Date()
    const timeFill = dateOnly === true ? null : 0

    if (props.calendar === 'persian') {
      const jDate = toJalaali(d)
      return {
        year: jDate.jy,
        month: jDate.jm,
        day: jDate.jd
      }
    }
    else if (props.calendar === 'islamic') {
      const iDate = GregorianToHijri(d)
      return {
        year: iDate.iy,
        month: iDate.im,
        day: iDate.id
      }
    }

    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: timeFill,
      minute: timeFill,
      second: timeFill,
      millisecond: timeFill
    }
  }

  return {
    editable,
    tabindex,
    headerClass,

    getLocale,
    getCurrentDate
  }
}
