
/* eslint-disable */
/**
 * @jest-environment jsdom
 */

import { mount, createLocalVue, shallowMount } from '@vue/test-utils'
import { mountQuasar } from '~/test/jest/utils'
import QFAB from './../components/QFAB.vue'
import { Quasar, QFab } from 'quasar'

describe('generated QFab test', () => {
  const wrapper = mountQuasar(QFAB, {
    utils: {
      appError: () => (fn) => fn,
      appSuccess: () => (fn) => fn
    }
  })
  const vm = wrapper.vm

  it('passes the sanity check and creates a wrapper', () => {
    expect(wrapper.isVueInstance()).toBe(true)
  })
   it('mounts', () => {
    const localVue = createLocalVue()
    localVue.use(Quasar, { components: { QFab } })
    const wrapper2 = mount(QFAB, {
      localVue
    })
  })
})

