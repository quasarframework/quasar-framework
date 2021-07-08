---
title: Quasar CLI Installation
desc: How to install the Quasar CLI on your development machine.
---

Make sure that you have Node >=12.22.1 and NPM >=6.14.12 installed on your machine.

::: warning
**Do not use uneven versions of Node i.e. 13, 15, etc.** These versions are not tested with Quasar and often cause issues due to their experimental nature. We highly recommend always using the LTS version of Node.
:::

```bash
# Node.js >=12.22.1 is required.

$ yarn global add @quasar/cli
# or
$ npm install -g @quasar/cli
```

::: tip
Installing [Volta](https://volta.sh/) will help enforce an LTS version of Node for you.

::: tip
If you are using Yarn, make sure that the Yarn [global install location](https://yarnpkg.com/lang/en/docs/cli/global/) is in your PATH:

```bash
# in ~/.bashrc or equivalent
export PATH="$(yarn global bin):$PATH"
```

Under Windows, modify user's PATH environment variable. If you are using yarn then add `%LOCALAPPDATA%\yarn\bin`, otherwise if you're using npm then add `%APPDATA%\npm`.
:::

Then we create a project folder with Quasar CLI:

```bash
## Quasar UI v2
$ quasar create <folder_name>
```

:::tip
Some **advanced** scenarios require to use a custom starter kit (eg. testing or personal presets). In those **rare** cases, you can use `--kit` option. Read more about this into [create command](/quasar-cli/commands-list#create) description. Remember that the recommended way to go is through writing a Quasar App Extension though.
:::

:::tip WSL2
Microsoft's recommended [Nodejs development environment setup in WSL2](https://docs.microsoft.com/en-us/windows/nodejs/setup-on-wsl2).

When using WSL2 (Windows Subsystem for Linux) [Microsoft recommends](https://docs.microsoft.com/en-us/windows/wsl/compare-versions#performance-across-os-file-systems) keeping files in the linux file sytem to maximize performance.  Projects will build around 3X slower and HMR (Hot Module Reload) will not work ([without a hack](/quasar-cli/quasar-conf-js#Docker-and-WSL-Issues-with-HRM)) if the project files are on the Windows mount instead of the local linux file system.  This is also true in Docker for Windows based development environments.
:::

Note that you don't need separate projects if you want to build any of the available platforms. This one project can seamlessly handle all of them.

To continue your learning about Quasar, you should familiarize yourself with the Quasar CLI in depth, because you will be using it a lot.

## How it works

Quasar CLI is made up of two packages: `@quasar/cli` and `@quasar/app`. The first one is optional and only allows you to create a project folder and globally run Quasar commands. The second package is the heart of it and it gets installed into every Quasar project folder.

Once a project folder has been generated, Quasar CLI will only help in running `@quasar/app`'s commands globally. You don't need it for anything else at this point. To ensure full independence from Quasar CLI you can write npm scripts (in your `package.json`) to run Quasar commands. It is `@quasar/app` (which is specific to each project) that will run all the CLI commands.

Example of adding a few npm scripts into your `package.json`:

```js
// package.json
"scripts": {
  "dev": "quasar dev",
  "build": "quasar build",
  "build:pwa": "quasar build -m pwa"
}
```

The above will allow you to run `$ yarn dev` or `$ yarn build` without the need of a globally installed `@quasar/cli`, should you wish to do so.

Alternatively, you can even use [npx](https://github.com/npm/npx) to run quasar commands without the need of a globally installed `@quasar/cli`.

```bash
$ npx quasar dev
```
