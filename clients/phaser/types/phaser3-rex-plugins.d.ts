declare module "phaser3-rex-plugins/dist/rexuiplugin.js" {
  const UIPlugin: any;
  export default UIPlugin;
}

declare module "phaser3-rex-plugins/dist/rexuiplugin.min.js" {
  const UIPlugin: any;
  export default UIPlugin;
}

declare namespace Phaser {
  namespace Plugins {
    interface ScenePlugins {
      rexUI: any;
    }
  }
}
