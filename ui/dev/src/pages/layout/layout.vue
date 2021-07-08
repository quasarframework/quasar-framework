<template>
  <div>
    <q-layout :view="view" @scroll="onScroll">
      <q-header height-hint="204" v-model="header" :bordered="bordered" :elevated="elevated" :reveal="headerReveal" :class="marginalClass">
        <q-bar>
          <q-icon name="network_wifi" />
          <div>9:34</div>
          <q-space />
          <q-btn round dense flat icon="help" class="q-mr-md" />
          <q-btn dense flat icon="minimize" />
          <q-btn dense flat icon="crop_square" />
          <q-btn dense flat icon="close" />
        </q-bar>

        <q-toolbar>
          <q-btn flat round dense icon="menu" @click="left = !left" />
          <q-space />
          <q-toggle dense v-model="extraRow" color="amber" dark label="Extra row" />
          <q-btn round dense flat class="relative-position q-mx-md" icon="announcement" to="/">
            <q-badge floating color="red" text-color="white">
              1
            </q-badge>
          </q-btn>
          <q-btn flat round dense icon="colorize">
            <q-menu>
              <q-color hide-underline dark v-model="mainColor" />
            </q-menu>
          </q-btn>
          <q-toggle dense v-model="toggle" color="amber" dark />
          <q-btn flat round dense icon="menu" @click="right = !right" />
        </q-toolbar>
        <q-toolbar v-if="extraRow" inset>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          <q-toolbar-title>
            <strong>Quasar</strong> Framework
          </q-toolbar-title>

          <q-input model-value="" dense standout dark>
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-toolbar>
        <q-tabs indicator-color="yellow">
          <q-route-tab icon="view_quilt" to="/layout-quick/default" replace label="Default Tab" />
          <q-route-tab icon="view_day" to="/layout-quick/a" exact replace label="A" />
          <q-route-tab icon="view_day" to="/layout-quick/b" replace label="B" />
          <q-route-tab icon="input" to="/layout-quick/c" replace label="C" />
        </q-tabs>
      </q-header>

      <q-footer height-hint="100" v-model="footer" :bordered="bordered" :elevated="elevated" :reveal="footerReveal" :class="marginalClass">
        <q-toolbar>
          <q-btn flat round dense icon="menu" @click="left = !left" />
          <q-toolbar-title>
            Footer
          </q-toolbar-title>
          <q-btn flat round dense icon="menu" @click="right = !right" />
        </q-toolbar>
        <q-toolbar>
          <q-btn flat round dense icon="menu" @click="left = !left" />
          <q-toolbar-title>
            Footer
          </q-toolbar-title>
          <q-btn flat round dense icon="menu" @click="right = !right" />
        </q-toolbar>
      </q-footer>

      <q-drawer
        v-model="right"
        side="right"
        :bordered="bordered"
        :elevated="elevated"
        :overlay="rightOverlay"
        :behavior="rightBehavior"
        :breakpoint="rightBreakpoint"
        :mini="rightMini"
        :mini-to-overlay="rightMiniToOverlay"
        @on-layout="drawerOnLayout"
      >
        <q-scroll-area
          :thumb-style="{
            right: '4px',
            background: '#027be3',
            opacity: .8,
            width: '4px'
          }"
          style="height: calc(100% - 204px); margin-top: 204px"
        >
          <div class="q-pa-sm">
            <q-btn to="/layout-quick/a">
              Go to A
            </q-btn>
            <q-btn to="/layout-quick/b">
              Go to B
            </q-btn>
            <q-btn to="/layout-quick/c">
              Go to C
            </q-btn>

            <br><br>fffdfs
            {{ right }}
            <q-input v-model="inp" />

            <q-slider v-model="slider" class="q-my-lg" />

            <q-btn to="/layout-quick/a" replace>
              Replace Go to A
            </q-btn>
            <q-btn to="/layout-quick/b" replace>
              Replace Go to B
            </q-btn>
            <q-btn to="/layout-quick/c" replace>
              Replace Go to C
            </q-btn>
            <div v-for="n in 30" :key="n">
              {{ n }} Left drawer
            </div>
          </div>
        </q-scroll-area>

        <q-img class="absolute-top" src="https://cdn.quasar.dev/img/material.png" style="height: 204px">
          <div class="absolute-bottom bg-transparent">
            <q-avatar size="56px" class="q-mb-sm">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png">
            </q-avatar>
            <div class="text-weight-bold">
              Razvan Stoenescu
            </div>
            <div>@rstoenescu</div>
          </div>
        </q-img>
      </q-drawer>

      <!--
        @mouseover="leftMini = false"
        @mouseleave="leftMini = true"
        ...or
        @click.capture="e => {
          if (leftMini) {
            leftMini = false
            e.preventDefault()
            e.stopPropagation()
          }
        }"
      -->
      <q-page-container>
        <q-drawer
          side="left"
          :mini="leftMini"
          :mini-width="72"
          @mini-state="onMiniState"
          :bordered="bordered"
          :elevated="elevated"
          @click.capture="e => {
            if (leftMini) {
              leftMini = false
              e.preventDefault()
              e.stopPropagation()
            }
          }"
          v-model="left"
          :overlay="leftOverlay"
          :behavior="leftBehavior"
          :breakpoint="leftBreakpoint"
          :mini-to-overlay="leftMiniToOverlay"
        >
          <!--
            <template v-slot:mini>
              <div>
                <q-btn
                  class="q-mini-drawer-hide"
                  icon="keyboard_arrow_right"
                  @click="goMini"
                />
                <div>mini</div>
              </div>
            </template>
        -->
          <q-input v-model="inp" />
          <input v-model="inp">
          <q-btn
            class="q-mini-drawer-hide"
            icon="keyboard_arrow_left"
            @click="leftMini = true"
          />
          <div class="q-mini-drawer-hide">
            Maxi only
          </div>
          <div class="q-mini-drawer-only">
            Mini only
          </div>
          <q-list>
            <q-expansion-item clickable icon="perm_identity" label="With a model and events">
              <q-card>
                <q-card-section>
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Esse, fuga voluptatem! Debitis, numquam! Velit excepturi harum sint explicabo, rerum dolores illum nihil aperiam praesentium, consectetur delectus sapiente in sed provident.
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-item-label header>
              Folders
            </q-item-label>

            <q-item to="/layout-quick/a" replace>
              <q-item-section side>
                <q-avatar icon="folder" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Link A</q-item-label>
                <q-item-label caption>
                  February 22, 2016
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon name="info" color="green" />
              </q-item-section>
            </q-item>

            <q-item to="/layout-quick/b" replace>
              <q-item-section side>
                <q-avatar icon="folder" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Link B</q-item-label>
                <q-item-label caption>
                  February 22, 2016
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon name="info" color="green" />
              </q-item-section>
            </q-item>

            <q-item to="/layout-quick/c" replace>
              <q-item-section side>
                <q-avatar icon="folder" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Link C</q-item-label>
                <q-item-label caption>
                  February 22, 2016
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon name="info" color="green" />
              </q-item-section>
            </q-item>

            <q-separator spaced />
            <q-item-label header>
              Files
            </q-item-label>

            <q-item clickable>
              <q-item-section side>
                <q-avatar icon="assignment" color="grey-6" text-color="white" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Link C</q-item-label>
                <q-item-label caption>
                  February 22, 2016
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon name="info" />
              </q-item-section>
            </q-item>

            <q-item clickable>
              <q-item-section side>
                <q-avatar icon="place" color="grey-6" text-color="white" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Link C</q-item-label>
                <q-item-label caption>
                  February 22, 2016
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon name="info" color="amber" />
              </q-item-section>
            </q-item>

            <q-separator spaced />
            <q-item-label header>
              People
            </q-item-label>

            <q-item v-for="n in 3" :key="'item.' + n">
              <q-item-section side>
                <q-avatar>
                  <img src="https://cdn.quasar.dev/img/boy-avatar.png">
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>John</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chat_bubble" color="green" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-drawer>

        <router-view v-slot="{ Component }">
          <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>

        <div class="fixed-bottom-right bg-grey-5 q-pa-sm" style="bottom: 8px; right: 8px; left: auto;z-index: 6000;">
          <q-toggle dense v-model="showConfig" label="Config" />
        </div>
      </q-page-container>
    </q-layout>

    <div class="fixed-center bg-amber z-fullscreen" v-if="showConfig">
      <div class="row no-wrap">
        <div class="col q-ma-xs">
          <div>
            <q-toggle dense v-model="header" label="Header" />
          </div>
          <div>
            <q-toggle dense v-model="headerReveal" label="Header Reveal" />
          </div>
          <div class="q-mt-sm">
            <q-toggle dense v-model="left" label="Left Drawer" />
          </div>
          <div>
            <q-toggle dense v-model="leftOverlay" label="Left as Overlay" />
          </div>
          <div>
            <q-toggle dense v-model="leftMiniToOverlay" label="Left Mini to Overlay" />
          </div>
          <div>
            <q-select emit-value v-model="leftBehavior" :options="drawerBehaviorOptions" />
          </div>
          <div>
            <q-input type="number" align="right" prefix="Bkpt" placeholder="Bkpt" v-model.number="leftBreakpoint" />
          </div>
        </div>
        <div class="col q-ma-xs">
          <div>
            <q-toggle dense v-model="footer" label="Footer" />
          </div>
          <div>
            <q-toggle dense v-model="footerReveal" label="Footer Reveal" />
          </div>
          <div class="q-mt-sm">
            <q-toggle dense v-model="right" label="Right Drawer" />
          </div>
          <div>
            <q-toggle dense v-model="rightOverlay" label="Right as Overlay" />
          </div>
          <div>
            <q-toggle dense v-model="rightMiniToOverlay" label="Right Mini to Overlay" />
          </div>
          <div>
            <q-select emit-value v-model="rightBehavior" :options="drawerBehaviorOptions" />
          </div>
          <div>
            <q-input type="number" align="right" prefix="Bkpt" placeholder="Bkpt" v-model.number="rightBreakpoint" />
          </div>
        </div>
      </div>

      <div class="row justify-center q-mt-big">
        <q-chip color="primary">
          view: {{ view }}
        </q-chip>
      </div>
      <div class="flex justify-center">
        <div style="min-width: 400px; max-width: 90vw">
          <div class="doc-layout-grid row justify-center">
            <div class="doc-row-definition row flex-center no-border">
              Header
            </div>
            <div class="col column flex-center">
              <q-radio dense color="orange" v-model="topleft" val="l" label="l" />
              <q-radio dense color="orange" v-model="topleft" val="h" label="h" />
            </div>
            <div class="col column flex-center">
              <q-radio dense v-model="topcenter" val="h" label="h" />
              <q-radio dense v-model="topcenter" val="H" label="H" />
            </div>
            <div class="col column flex-center">
              <q-radio dense color="secondary" v-model="topright" val="r" label="r" />
              <q-radio dense color="secondary" v-model="topright" val="h" label="h" />
            </div>
          </div>
          <q-separator />

          <div class="doc-layout-grid row justify-center">
            <div class="doc-row-definition row flex-center no-border">
              Middle
            </div>
            <div class="col column flex-center">
              <q-radio dense color="orange" v-model="middleleft" val="l" label="l" />
              <q-radio dense color="orange" v-model="middleleft" val="L" label="L" />
            </div>
            <div class="col column flex-center">
              <q-radio dense v-model="middlecenter" val="p" label="p" />
            </div>
            <div class="col column flex-center">
              <q-radio dense color="secondary" v-model="middleright" val="r" label="r" />
              <q-radio dense color="secondary" v-model="middleright" val="R" label="R" />
            </div>
          </div>
          <q-separator />

          <div class="doc-layout-grid row justify-center">
            <div class="doc-row-definition row flex-center no-border">
              Footer
            </div>
            <div class="col column flex-center">
              <q-radio dense color="orange" v-model="bottomleft" val="l" label="l" />
              <q-radio dense color="orange" v-model="bottomleft" val="f" label="f" />
            </div>
            <div class="col column flex-center">
              <q-radio dense v-model="bottomcenter" val="f" label="f" />
              <q-radio dense v-model="bottomcenter" val="F" label="F" />
            </div>
            <div class="col column flex-center">
              <q-radio dense color="secondary" v-model="bottomright" val="r" label="r" />
              <q-radio dense color="secondary" v-model="bottomright" val="f" label="f" />
            </div>
          </div>
          <q-toggle dense v-model="leftMini" label="Left mini" />
          <q-toggle dense v-model="rightMini" label="Right mini" />
          <q-toggle dense v-model="bordered" label="Bordered" />
          <q-toggle dense v-model="elevated" label="Elevated" />
          <q-toggle dense v-model="whiteLayout" label="White bg" />
        </div>
      </div>
    </div>

    <q-dialog v-model="toggle">
      <q-card>
        <q-card-section>
          <div class="text-h6">
            Dialog
          </div>
        </q-card-section>

        <q-card-section>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum repellendus sit voluptate voluptas eveniet porro. Rerum blanditiis perferendis totam, ea at omnis vel numquam exercitationem aut, natus minima, porro labore.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat color="primary" label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style lang="sass">
  .fit-min
    min-width: 100%
    min-height: 100%
    height: 0px
</style>

<script>
import { setCssVar } from 'quasar'

export default {
  data () {
    const v = 'lHh LpR fFf'
    return {
      mainColor: '#027be3',
      extraRow: true,

      toggle: false,
      header: true,
      footer: true,
      left: true, // this.$q.screen.width > 1023,
      right: this.$q.screen.width > 1023,

      headerReveal: false,
      footerReveal: false,
      leftOverlay: false,
      rightOverlay: false,
      leftBehavior: 'default',
      rightBehavior: 'default',
      leftBreakpoint: 992,
      rightBreakpoint: 992,
      leftMini: false,
      leftMiniToOverlay: false,
      rightMini: false,
      rightMiniToOverlay: false,

      bordered: false,
      elevated: false,
      whiteLayout: false,

      scrolling: true,

      topleft: v[ 0 ],
      topcenter: v[ 1 ],
      topright: v[ 2 ],
      middleleft: v[ 4 ],
      middlecenter: v[ 5 ],
      middleright: v[ 6 ],
      bottomleft: v[ 8 ],
      bottomcenter: v[ 9 ],
      bottomright: v[ 10 ],
      drawerBehaviorOptions: [
        { label: 'Behave Normal', value: 'default' },
        { label: 'Behave Mobile', value: 'mobile' },
        { label: 'Behave Desktop', value: 'desktop' }
      ],

      showConfig: true,
      inp: '',
      slider: 1
    }
  },
  computed: {
    view () {
      const
        top = `${ this.topleft }${ this.topcenter }${ this.topright }`,
        middle = `${ this.middleleft }${ this.middlecenter }${ this.middleright }`,
        bottom = `${ this.bottomleft }${ this.bottomcenter }${ this.bottomright }`

      return `${ top } ${ middle } ${ bottom }`
    },
    marginalClass () {
      return this.whiteLayout
        ? 'bg-white text-black'
        : 'bg-primary text-white'
    }
  },
  watch: {
    mainColor (v) {
      setCssVar('primary', v)
    }
  },
  methods: {
    drawerOnLayout (v) {
      console.log('drawer on layout:', v)
    },
    onScroll (data) {
      // console.log('scroll', data)
    },
    goMini () {
      console.log('goMini')
      this.rightMini = true
    },
    goNormal (e) {
      if (this.rightMini) {
        console.log('goNormal')
        this.rightMini = false
        e.preventDefault()
        e.stopPropagation()
      }
      else {
        console.log('goNormal abort')
      }
    },
    onMiniState (val) {
      console.log('left drawer @mini-state ->', val)
    }
  }
}
</script>
