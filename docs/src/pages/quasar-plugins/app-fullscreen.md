---
title: Fullscreen Plugin
desc: A Quasar plugin to toggle the fullscreen state of your app through the Web Fullscreen API.
keys: AppFullScreen
---
There are times when you want your website or App to run in fullscreen.
Quasar makes it easy by wrapping the [Web Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API).

::: warning
Please note that the behavior is different depending on the platform the code is running on, due to the fact that there isn't a fixed Web standard for Web Fullscreen API yet.
:::

## AppFullscreen API

<doc-api file="AppFullscreen" />

## Installation
<doc-installation plugins="AppFullscreen" />

## Usage
::: tip
For an exhaustive list of properties and methods, please check out the API section.
:::

```js
// outside of a Vue file
import { AppFullscreen } from 'quasar'

// Requesting fullscreen mode:
AppFullscreen.request()
  .then(() => {
    // success!
  })
  .catch(err => {
    // oh, no!!!
  })

// Exiting fullscreen mode:
AppFullscreen.exit()
  .then(() => {
    // success!
  })
  .catch(err => {
    // oh, no!!!
  })
```

```js
// inside of a Vue file

import { useQuasar } from 'quasar'

setup () {
  const $q = useQuasar()

  // Requesting fullscreen mode:
  $q.fullscreen.request()
    .then(() => {
      // success!
    })
    .catch(err => {
      // oh, no!!!
    })

  // Exiting fullscreen mode:
  $q.fullscreen.exit()
    .then(() => {
      // success!
    })
    .catch(err => {
      // oh, no!!!
    })
}
```

<doc-example title="Basic" file="AppFullscreen/Basic" />

<doc-example title="On custom element" file="AppFullscreen/Targeted" />

::: tip
When requesting fullscreen on a custom element, Quasar will append div elements as direct children to the target for q-menu, q-tooltip, and q-notification components. When requesting fullscreen on some components such as a q-card, these added children divs may interfere with the default styling of the target element. It is recommended to wrap the target you wish to fullscreen with a container div, and request fullscreen on that wrapper instead.
:::

::: warning
On some phones this will have little effect:
* For example, on Samsung S4, when App goes into fullscreen, the top bar will slide up but still remain on screen.
* On Nexus phones, on the other hand, like Nexus 5, Android navigation buttons and top bar disappear completely.

It all depends on the Web Fullscreen API support of the platform the code is running on.
:::

## Watching for fullscreen changes

```vue
<template>...</template>

<script>
import { useQuasar } from 'quasar'
import { watch } from 'vue'

export default {
  setup () {
    const $q = useQuasar()

    watch(() => $q.fullscreen.isActive, val => {
      console.log(val ? 'In fullscreen now' : 'Exited fullscreen')
    })
  }
}
</script>
```
