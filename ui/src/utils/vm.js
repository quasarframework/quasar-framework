import { isSSR } from '../plugins/Platform.js'

export function getAllChildren (vm, children = []) {
  vm.$children.forEach(function (child) {
    children.push(child)
    child.$children.length > 0 && getAllChildren(child, children)
  })
  return children
}

export function getVmOfNode (el) {
  for (let node = el; node !== null; node = node.parentNode) {
    // node.__vue__ can be null if the instance was destroyed
    if (node.__vue__ === null) {
      return
    }
    if (node.__vue__ !== void 0) {
      return node.__vue__
    }
  }
}

export function isVmChildOf (childVm, parentVm) {
  for (let vm = childVm; vm !== void 0; vm = vm.$parent) {
    if (vm === parentVm) {
      return true
    }
  }
  return false
}

export function cache (vm, key, on) {
  if (isSSR === true) { return on }

  const fullKey = key + '#' + Object.keys(on).join('#')

  if (vm.$__cacheOn === void 0) {
    vm.$__cacheOn = {}
  }

  if (vm.$__cacheOn[fullKey] === void 0) {
    vm.$__cacheOn[fullKey] = on
  }

  return vm.$__cacheOn[fullKey]
}
