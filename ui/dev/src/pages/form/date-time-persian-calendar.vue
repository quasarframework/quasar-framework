<template>
  <div class="q-layout-padding column q-gutter-y-md q-pa-xl" dir="rtl">
    <q-date
      v-model="persianDate"
      calendar="persian"
      today-btn
    ></q-date>
  </div>
</template>

<script>
export default {
  data () {
    return {
      persianDate: '1400/04/09'
    }
  },
  created () {
    import('quasar/lang/fa')
      .then(lang => {
        this.$q.lang.set(lang.default)
      })
  }
}
</script>
