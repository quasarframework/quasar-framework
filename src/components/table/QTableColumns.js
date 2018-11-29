import Vue from 'vue'

import QSelect from '../select/QSelect.js'

export default Vue.extend({
  name: 'QTableColumns',

  props: {
    value: {
      type: Array,
      required: true
    },
    label: String,
    columns: {
      type: Array,
      required: true
    },
    color: String,
    dark: Boolean
  },

  computed: {
    computedOptions () {
      return this.columns.filter(col => col.required !== true)
    }
  },

  render (h) {
    return h(QSelect, {
      props: {
        multiple: true,
        value: this.value,
        options: this.computedOptions,
        optionValue: 'name', // col.name
        displayValue: this.label || this.$q.i18n.table.columns,
        color: this.color,
        dark: this.dark,
        borderless: true
      },
      on: this.$listeners
    })
  }
})
