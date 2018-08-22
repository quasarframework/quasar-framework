process.env.NODE_ENV = 'development'

const
  webpack = require('webpack'),
  WebpackDevServer = require('webpack-dev-server')

const
  env = require('./env'),
  webpackConfig = require('./webpack.spa')

console.log()
console.log(` ☕️ Preparing for Quasar v${env.quasarVersion}`)
console.log()
console.log(` 🚀 Starting dev server with ${env.theme.toUpperCase()} theme...`)
console.log(`    Will listen at ${env.uri}`)
console.log(`    Browser will open when build is ready.\n`)

const compiler = webpack(webpackConfig)

compiler.hooks.done.tap('dev-server-done-compiling', compiler => {
  if (this.__started) { return }

  // start dev server if there are no errors
  if (compiler.compilation.errors && compiler.compilation.errors.length > 0) {
    return
  }

  this.__started = true

  server.listen(env.port, env.host, () => {
    require('opn')(env.uri)
  })
})

// start building & launch server
const server = new WebpackDevServer(compiler, env.devServerConfig)
