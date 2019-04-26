
/* eslint-disable */
/**
 * @jest-environment jsdom
 */

import { mount, createLocalVue, shallowMount } from '@vue/test-utils'
import { mountQuasar } from '~/test/jest/utils'
import QCARDSECTION from './../components/QCARDSECTION.vue'
import { Quasar, QCardSection } from 'quasar'

describe('generated QCardSection test', () => {
  const wrapper = mountQuasar(QCARDSECTION, {
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
    localVue.use(Quasar, { components: { QCardSection } })
    const wrapper2 = mount(QCARDSECTION, {
      localVue
    })
  })
})

