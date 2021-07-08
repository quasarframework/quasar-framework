export interface IResolve {
  cli: (dir: string) => string,
  app: (dir: string) => string,
  src: (dir: string) => string,
  pwa: (dir: string) => string,
  ssr: (dir: string) => string,
  cordova: (dir: string) => string,
  capacitor: (dir: string) => string,
  electron: (dir: string) => string,
  bex: (dir: string) => string,
}

export interface QuasarAppPaths {
  cliDir: string,
  appDir: string,
  srcDir: string,
  pwaDir: string,
  ssrDir: string,
  cordovaDir: string,
  capacitorDir: string,
  electronDir: string,
  bexDir: string,
  resolve: IResolve
} 