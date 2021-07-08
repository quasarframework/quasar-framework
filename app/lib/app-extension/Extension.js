const fs = require('fs-extra')
const path = require('path')

const { log, warn, fatal } = require('../helpers/logger')
const appPaths = require('../app-paths')
const { spawnSync } = require('../helpers/spawn')
const extensionJson = require('./extension-json')

async function promptOverwrite ({ targetPath, options }) {
  const inquirer = require('inquirer')

  const choices = [
    { name: 'Overwrite', value: 'overwrite' },
    { name: 'Overwrite all', value: 'overwriteAll' },
    { name: 'Skip (might break extension)', value: 'skip' },
    { name: 'Skip all (might break extension)', value: 'skipAll' }
  ]

  const answer = await inquirer.prompt([{
    name: 'action',
    type: 'list',
    message: `Overwrite "${path.relative(appPaths.appDir, targetPath)}"?`,
    choices: options !== void 0
      ? choices.filter(choice => options.includes(choice.value))
      : choices,
    default: 'overwrite'
  }])
  return answer
}

async function renderFile ({ sourcePath, targetPath, rawCopy, scope, overwritePrompt }) {
  const isBinary = require('isbinaryfile').isBinaryFileSync
  const compileTemplate = require('lodash.template')

  if (overwritePrompt === true && fs.existsSync(targetPath)) {
    const answer = await promptOverwrite({
      targetPath,
      options: [ 'overwrite', 'skip' ]
    })

    if (answer.action === 'skip') {
      return
    }
  }

  fs.ensureFileSync(targetPath)

  if (rawCopy || isBinary(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath)
  }
  else {
    const rawContent = fs.readFileSync(sourcePath, 'utf-8')
    const template = compileTemplate(rawContent, { 'interpolate': /<%=([\s\S]+?)%>/g })
    fs.writeFileSync(targetPath, template(scope), 'utf-8')
  }
}

async function renderFolders ({ source, rawCopy, scope }) {
  const fglob = require('fast-glob')

  let overwrite
  const files = fglob.sync(['**/*'], { cwd: source })

  for (const rawPath of files) {
    const targetRelativePath = rawPath.split('/').map(name => {
      // dotfiles are ignored when published to npm, therefore in templates
      // we need to use underscore instead (e.g. "_gitignore")
      if (name.charAt(0) === '_' && name.charAt(1) !== '_') {
        return `.${name.slice(1)}`
      }
      if (name.charAt(0) === '_' && name.charAt(1) === '_') {
        return `${name.slice(1)}`
      }
      return name
    }).join('/')

    const targetPath = appPaths.resolve.app(targetRelativePath)
    const sourcePath = path.resolve(source, rawPath)

    if (overwrite !== 'overwriteAll' && fs.existsSync(targetPath)) {
      if (overwrite === 'skipAll') {
        continue
      }
      else {
        const answer = await promptOverwrite({ targetPath })

        if (answer.action === 'overwriteAll') {
          overwrite = 'overwriteAll'
        }
        else if (answer.action === 'skipAll') {
          overwrite = 'skipAll'
          continue
        }
        else if (answer.action === 'skip') {
          continue
        }
      }
    }

    renderFile({ sourcePath, targetPath, rawCopy, scope })
  }
}

module.exports = class Extension {
  constructor (name) {
    if (name.charAt(0) === '@') {
      const slashIndex = name.indexOf('/')
      if (slashIndex === -1) {
        fatal(`Invalid Quasar App Extension name: "${name}"`)
      }

      this.packageFullName = name.substring(0, slashIndex + 1) +
        'quasar-app-extension-' +
        name.substring(slashIndex + 1)

      this.packageName = '@' + this.__stripVersion(this.packageFullName.substring(1))
      this.extId = '@' + this.__stripVersion(name.substring(1))
    }
    else {
      this.packageFullName = 'quasar-app-extension-' + name
      this.packageName = this.__stripVersion('quasar-app-extension-' + name)
      this.extId = this.__stripVersion(name)
    }
  }

  isInstalled () {
    try {
      const pkgSrc = this.__getPkgSrc()
      require.resolve(`${this.packageName}/${pkgSrc}/index`, {
        paths: [ appPaths.appDir ]
      })
    }
    catch (e) {
      return false
    }

    return true
  }

  async install (skipPkgInstall) {
    if (/quasar-app-extension-/.test(this.extId)) {
      this.extId = this.extId.replace('quasar-app-extension-', '')
      log(
        `When using an extension, "quasar-app-extension-" is added automatically. Just run "quasar ext add ${
          this.extId
        }"`
      )
    }

    log(`${skipPkgInstall ? 'Invoking' : 'Installing'} "${this.extId}" Quasar App Extension`)
    log()

    const isInstalled = this.isInstalled()

    // verify if already installed
    if (skipPkgInstall === true) {
      if (!isInstalled) {
        fatal(`Tried to invoke App Extension "${this.extId}" but its npm package is not installed`)
      }
    }
    else if (isInstalled) {
      const inquirer = require('inquirer')
      const answer = await inquirer.prompt([{
        name: 'reinstall',
        type: 'confirm',
        message: `Already installed. Reinstall?`,
        default: false
      }])

      if (!answer.reinstall) {
        return
      }
    }

    // yarn/npm install
    skipPkgInstall !== true && this.__installPackage()

    const prompts = await this.__getPrompts()

    extensionJson.set(this.extId, prompts)

    // run extension install
    const hooks = await this.__runInstallScript(prompts)

    log(`Quasar App Extension "${this.extId}" successfully installed.`)
    log()

    if (hooks && hooks.exitLog.length > 0) {
      hooks.exitLog.forEach(msg => {
        console.log(msg)
      })
      console.log()
    }
  }

  async uninstall (skipPkgUninstall) {
    log(`${skipPkgUninstall ? 'Uninvoking' : 'Uninstalling'} "${this.extId}" Quasar App Extension`)
    log()

    const isInstalled = this.isInstalled()

    // verify if already installed
    if (skipPkgUninstall === true) {
      if (!isInstalled) {
        fatal(`Tried to uninvoke App Extension "${this.extId}" but there's no npm package installed for it.`)
      }
    }
    else if (!isInstalled) {
      warn(`Quasar App Extension "${this.packageName}" is not installed...`)
      return
    }

    const prompts = extensionJson.getPrompts(this.extId)
    const hooks = await this.__runUninstallScript(prompts)

    extensionJson.remove(this.extId)

    // yarn/npm uninstall
    skipPkgUninstall !== true && this.__uninstallPackage()

    log(`Quasar App Extension "${this.extId}" successfully removed.`)
    log()

    if (hooks && hooks.exitLog.length > 0) {
      hooks.exitLog.forEach(msg => {
        console.log(msg)
      })
      console.log()
    }
  }

  async run (ctx) {
    if (!this.isInstalled()) {
      warn(`Quasar App Extension "${this.extId}" is missing...`)
      process.exit(1, 'ext-missing')
    }

    const script = this.__getScript('index', true)
    const IndexAPI = require('./IndexAPI')

    const api = new IndexAPI({
      extId: this.extId,
      prompts: extensionJson.getPrompts(this.extId),
      ctx
    })

    log(`Running "${this.extId}" Quasar App Extension...`)
    await script(api)

    return api.__getHooks()
  }

  __stripVersion (packageFullName) {
    const index = packageFullName.indexOf('@')

    return index > -1
      ? packageFullName.substring(0, index)
      : packageFullName
  }

  async __getPrompts () {
    const questions = this.__getScript('prompts')

    if (!questions) {
      return {}
    }

    const inquirer = require('inquirer')
    const prompts = await inquirer.prompt(questions())

    console.log()
    return prompts
  }

  __installPackage () {
    const nodePackager = require('../helpers/node-packager')
    const cmdParam = nodePackager === 'npm'
      ? ['install', '--save-dev']
      : ['add', '--dev']

    log(`Retrieving "${this.packageFullName}"...`)
    spawnSync(
      nodePackager,
      cmdParam.concat(this.packageFullName),
      { cwd: appPaths.appDir, env: { ...process.env, NODE_ENV: 'development' } },
      () => fatal(`Failed to install ${this.packageFullName}`, 'FAIL')
    )
  }

  __uninstallPackage () {
    const nodePackager = require('../helpers/node-packager')
    const cmdParam = nodePackager === 'npm'
      ? ['uninstall', '--save-dev']
      : ['remove']

    log(`Uninstalling "${this.packageName}"...`)
    spawnSync(
      nodePackager,
      cmdParam.concat(this.packageName),
      { cwd: appPaths.appDir, env: { ...process.env, NODE_ENV: 'development' } },
      () => warn(`Failed to uninstall "${this.packageName}"`)
    )
  }

  __getPkgSrc () {
    const pkg = require.resolve(this.packageName + `/package.json`, {
      paths: [ appPaths.appDir ]
    })
    return require(pkg).main.split('/')[0]
  }

  __getScript (scriptName, fatalError) {
    let script
    const pkgSrc = this.__getPkgSrc()
    try {
      script = require.resolve(`${this.packageName}/${pkgSrc}/${scriptName}`, {
        paths: [ appPaths.appDir ]
      })
    }
    catch (e) {
      if (fatalError) {
        fatal(`App Extension "${this.extId}" has missing ${scriptName} script...`)
      }

      return
    }

    return require(script)
  }

  async __runInstallScript (prompts) {
    const script = this.__getScript('install')

    if (!script) {
      return
    }

    log('Running App Extension install script...')

    const InstallAPI = require('./InstallAPI')

    const api = new InstallAPI({
      extId: this.extId,
      prompts
    })

    await script(api)

    const hooks = api.__getHooks()

    if (hooks.renderFolders.length > 0) {
      for (let entry of hooks.renderFolders) {
        await renderFolders(entry)
      }
    }

    if (hooks.renderFiles.length > 0) {
      for (let entry of hooks.renderFiles) {
        await renderFile(entry)
      }
    }

    if (api.__needsNodeModulesUpdate) {
      const nodePackager = require('../helpers/node-packager')
      const cmdParam = nodePackager === 'npm'
        ? ['install']
        : []

      log(`Updating dependencies...`)
      spawnSync(
        nodePackager,
        cmdParam,
        { cwd: appPaths.appDir, env: { ...process.env, NODE_ENV: 'development' } },
        () => warn(`Failed to update dependencies`)
      )
    }

    return hooks
  }

  async __runUninstallScript (prompts) {
    const script = this.__getScript('uninstall')

    if (!script) {
      return
    }

    log('Running App Extension uninstall script...')

    const UninstallAPI = require('./UninstallAPI')
    const api = new UninstallAPI({
      extId: this.extId,
      prompts
    })

    await script(api)

    return api.__getHooks()
  }
}
