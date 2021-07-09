<template>
  <div>
    <div class="q-layout-padding">
      <div class="q-my-sm row q-gutter-sm items-center">
        <div>
          <q-btn type="button" size="lg" label="Button" @click="onClick" />
        </div>
        <div>
          <q-btn type="a" size="lg" label="Link" text-color="primary" @click="onClick" />
        </div>
        <div>
          <q-btn round type="button" size="lg" icon="alarm" @click="onClick" />
        </div>
        <div>
          <q-btn round type="a" size="lg" icon="alarm" text-color="primary" @click="onClick" />
        </div>
        <div>
          <q-btn outline type="button" size="lg" label="Button" @click="onClick" />
        </div>
        <div>
          <q-btn outline type="a" size="lg" label="Link" color="primary" @click="onClick" />
        </div>
        <div>
          <q-btn outline round type="button" size="lg" icon="alarm" @click="onClick" />
        </div>
        <div>
          <q-btn outline round type="a" size="lg" icon="alarm" color="primary" @click="onClick" />
        </div>
        <div>
          <q-btn push type="button" size="lg" label="Button" @click="onClick" />
        </div>
        <div>
          <q-btn push type="a" size="lg" label="Link" text-color="primary" @click="onClick" />
        </div>
        <div>
          <q-btn push round type="button" size="lg" icon="alarm" @click="onClick" />
        </div>
        <div>
          <q-btn push round type="a" size="lg" icon="alarm" text-color="primary" @click="onClick" />
        </div>
      </div>

      <div class="row flex-center q-my-md">
        <span class="q-mr-sm">TouchRepeat:</span>
        <q-btn round class="on-left" icon="remove" v-touch-repeat:300:600.mouse.enter.space="() => { testN -= 1 }" @click="onClick" />
        <q-btn push round class="on-left" icon="remove" v-touch-repeat.mouse.enter.space="() => { testN -= 1 }" @click="onClick" />
        <q-input type="number" v-model="testN" align="right" />
        <q-btn push round class="on-right" icon="add" v-touch-repeat.mouse.enter.space="() => { testN += 1 }" @click="onClick" />
        <q-btn round class="on-right" icon="add" v-touch-repeat:300:600.mouse.enter.space="() => { testN += 1 }" @click="onClick" />
      </div>

      <div class="row flex-center q-my-md q-gutter-md">
        <router-link
          to="/components/button-functional?q=0&a=0"
          v-slot="{ href, route, isActive, isExactActive }"
        >
          <q-btn
            :flat="isActive !== true"
            :outline="isActive === true && isExactActive !== true"
            color="primary"
            size="lg"
            no-caps
            :label="`To '${route.fullPath} - routerLink slot: isActive=${isActive}, isExactActive=${isExactActive}, href=${href}`"
            :to="href"
            @click="onClick"
          />
        </router-link>
        <router-link
          to="/components/button-functional?q=1"
          v-slot="{ href, route, isActive, isExactActive }"
        >
          <q-btn
            :flat="isActive !== true"
            :outline="isActive === true && isExactActive !== true"
            color="primary"
            size="lg"
            no-caps
            :label="`To '${route.fullPath} - routerLink slot: isActive=${isActive}, isExactActive=${isExactActive}, href=${href}`"
            :to="href"
            @click="onClick"
          />
        </router-link>
        <router-link
          to="/components/button-functional?q=1&a=1"
          v-slot="{ href, route, isActive, isExactActive }"
        >
          <q-btn
            :flat="isActive !== true"
            :outline="isActive === true && isExactActive !== true"
            color="primary"
            size="lg"
            no-caps
            :label="`To '${route.fullPath} - routerLink slot: isActive=${isActive}, isExactActive=${isExactActive}, href=${href}`"
            :to="href"
            @click="onClick"
          />
        </router-link>
        <router-link
          to="/components/button-functional?q=1&a=2"
          v-slot="{ href, route, isActive, isExactActive }"
        >
          <q-btn
            :flat="isActive !== true"
            :outline="isActive === true && isExactActive !== true"
            color="primary"
            size="lg"
            no-caps
            :label="`To '${route.fullPath} - routerLink slot: isActive=${isActive}, isExactActive=${isExactActive}, href=${href}`"
            :to="href"
            @click="onClick"
          />
        </router-link>
        <router-link
          to="/components/button-functional?q=2"
          v-slot="{ href, route, isActive, isExactActive }"
        >
          <q-btn
            :flat="isActive !== true"
            :outline="isActive === true && isExactActive !== true"
            color="primary"
            size="lg"
            no-caps
            :label="`To '${route.fullPath} - routerLink slot: isActive=${isActive}, isExactActive=${isExactActive}, href=${href}`"
            :to="href"
            @click="onClick"
          />
        </router-link>

        <q-btn push type="a" size="lg" label="To '/components/button-functional#1' - a" to="/components/button-functional#1" text-color="primary" @click="onClick" />
        <q-btn push type="a" size="lg" label="To '/components/button-functional#2' - a - disable" to="/components/button-functional#2" text-color="primary" @click="onClick" disable />
        <q-btn push type="button" size="lg" label="To '/components/button-functional#3' - button" to="/components/button-functional#3" text-color="primary" @click="onClick" />
        <q-btn push type="button" size="lg" label="To '/components/button-functional#4' - button - disable" to="/components/button-functional#4" text-color="primary" @click="onClick" disable />
      </div>

      <form @submit.prevent="submit" @reset.prevent="reset" class="shadow-2 q-pa-md q-my-sm row items-center">
        <div class="col row items-center q-gutter-md">
          <div class="col">
            <q-input v-model="test" type="textarea" />
          </div>
          <div class="col">
            <q-input :value="testC" @change="v => testC = v.target.value" />
          </div>
          <div class="col">
            <q-input type="number" v-model="testN" />
          </div>
        </div>
        <q-btn fab-mini outline color="negative" icon="undo" type="reset" class="on-right" title="Reset" @click="onClick" />
        <q-btn fab outline color="primary" icon="send" type="submit" class="on-right" title="Submit" @click="onClick" />
        <q-btn fab outline color="primary" icon="send" type="a" class="on-right" title="Submit" @click="onClick" />
      </form>

      <form @submit.prevent="submit" class="shadow-2 q-pa-md q-my-sm row items-center">
        <div class="col row items-center q-gutter-md">
          <div class="col">
            <q-input v-model="test" type="textarea" />
          </div>
          <div class="col">
            <q-input :value="testC" @change="v => testC = v.target.value" />
          </div>
          <div class="col">
            <q-input type="number" v-model="testN" />
          </div>
        </div>
        <q-btn outline color="primary" label="Button" class="on-right" @click="onClick" />
      </form>

      <div class="row" style="width: 150px; margin: 50px;">
        <q-btn color="indigo" class="col-3" icon="search" to="test" />
        <q-btn color="indigo" class="col-3" icon="search" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      test: 'Initial value',
      testC: 'Initial value onChange',
      testN: 0
    }
  },
  methods: {
    submit () {
      this.$q.notify(`Submit called with: [${this.test}], [${this.testC}], [${this.testN}]`)
    },
    reset () {
      this.test = 'Initial value'
      this.testC = 'Initial value onChange'
      this.testN = 0
      this.$q.notify('Reset called')
    },
    onClick (e) {
      this.$q.notify('Click called')
      console.log('@click', e.target, e)
    }
  }
}
</script>
