<template>
  <div class="q-pa-md" style="max-width: 300px">
    <div class="q-gutter-md">
      <q-badge color="secondary" multi-line>
        Model: "{{ model }}"
      </q-badge>

      <q-select
        filled
        v-model="model"
        :options="options"
        label="Standard"
        color="teal"
        clearable
        options-selected-class="text-deep-orange"
      >
        <template v-slot:option="scope">
          <q-expansion-item
            expand-separator
            group="somegroup"
             header-class="text-weight-bold"
            :label="scope.opt.label"
          >
            <template v-for="child in scope.opt.children">
              <q-item
                :key="child.label"
                clickable
                v-ripple
                @click="model = child.label"
                :class="{ 'bg-light-blue-1': model === child.label }"
              >
                <q-item-section>
                  <q-item-label v-html="child.label" class="q-ml-md" />
                </q-item-section>
              </q-item>
            </template>
          </q-expansion-item>
        </template>
      </q-select>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      model: null,
      options: [
        {
          label: 'American cars',
          children: [
            {
              label: 'Ford'
            },
            {
              label: 'General Motors'
            },
            {
              label: 'Tesla'
            }
          ]
        },
        {
          label: 'German cars',
          children: [
            {
              label: 'Audi'
            },
            {
              label: 'BMW'
            },
            {
              label: 'Porsche'
            }
          ]
        },
        {
          label: 'Italian cars',
          children: [
            {
              label: 'Ferrari'
            },
            {
              label: 'Lamborghini'
            },
            {
              label: 'Maserati'
            }
          ]
        },
        {
          label: 'Japanese cars',
          children: [
            {
              label: 'Honda'
            },
            {
              label: 'Nissan'
            },
            {
              label: 'Toyota'
            }
          ]
        }
      ]
    }
  },

  methods: {
    getLabel (scope) {
      debugger
      console.log(scope)
      return scope.label
    }
  }
}
</script>
