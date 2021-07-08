<template>
  <div class="q-layout-padding column q-gutter-y-md q-pa-xl" dir="rtl">
    <q-date
      v-model="hijriDate"
      calendar="islamic"
      today-btn
    ></q-date>
    {{ hijriDate }}
  </div>
</template>

<script>
export default {
  data () {
    return {
      hijriDate: '1442/11/20'
    }
  },
  created () {
    import('quasar/lang/ar')
      .then(lang => {
        this.$q.lang.set(lang.default)
      })
  }
}
</script>
