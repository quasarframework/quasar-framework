import { IResolve } from './app-paths'

export interface IndexAPI {
  ctx: Record<string, unknown>
  extId: string
  prompts: Record<string, unknown>
  resolve: IResolve,
  appDir: string,
  // __hooks: IndexAPIHooks,
  getPersistentConf: () => Record<string, unknown>,
  setPersistentConf: (cfg: Record<string, unknown>) => void,
  mergePersistentConf: (cfg: Record<string, unknown>) => void,
  compatibleWith: (packageName: string, semverCondition?: string) => void,
  hasPackage: (packageName: string, semverCondition?: string) => boolean,
  hasExtension: (extId: string) => boolean,
  getPackageVersion: (packageName: string) => string|undefined
  extendQuasarConf: (fn: Function) => void,
  chainWebpack: (fn: Function) => void,
  extendWebpack: (fn: Function) => void,
  chainWebpackMainElectronProcess: (fn: Function) => void,
  extendWebpackMainElectronProcess: (fn: Function) => void,
  chainWebpackWebserver: (fn: Function) => void,
  extendWebpackWebserver: (fn: Function) => void,
  registerCommand: (commandName: string, fn: Function) => void,
  registerDescribeApi: (name: string, relativePath: string) => void,
  beforeDev: (fn: Function) => void,
  afterDev: (fn: Function) => void,
  beforeBuild: (fn: Function) => void,
  afterBuild: (fn: Function) => void,
  onPublish: (fn: Function) => void,
}

export interface InstallAPI {
  extId: string
  prompts: Record<string, unknown>
  resolve: IResolve,
  appDir: string,
  getPersistentConf: () => Record<string, unknown>,
  setPersistentConf: (cfg: Record<string, unknown>) => void,
  mergePersistentConf: (cfg: Record<string, unknown>) => void,
  compatibleWith: (packageName: string, semverCondition?: string) => void,
  hasPackage: (packageName: string, semverCondition?: string) => boolean,
  hasExtension: (extId: string) => boolean,
  getPackageVersion: (packageName: string) => string|undefined,
  extendPackageJson: (extPkg: object | string) => void,
  extendJsonFile: (file: string, newData: object) => void,
  render: (templatePath: string, scope?: object) => void,
  renderFile: (relativeSourcePath: string, relativeTargetPath: string, scope?: object) => void,
  onExitLog: (msg: string) => void
}

export interface UninstallAPI {
  extId: string
  prompts: Record<string, unknown>
  resolve: IResolve,
  appDir: string,
  getPersistentConf: () => Record<string, unknown>,
  hasExtension: (extId: string) => boolean,
  removePath: (__path: string) => void,
  onExitLog: (msg: string) => void,
} 