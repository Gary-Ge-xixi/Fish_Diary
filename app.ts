import { initPlatform, PlatformInfo } from './utils/platform'
import { initResponsive } from './utils/responsive'
import { CLOUD_ENV_ID } from './utils/config'

// 导出 getApp 函数供页面使用
export function getApp(): IAppOption & WechatMiniprogram.IAnyObject {
  return (globalThis as unknown as { getApp: () => IAppOption & WechatMiniprogram.IAnyObject }).getApp()
}

App<IAppOption>({
  onLaunch() {
    // 初始化平台检测（支持 HarmonyOS 等多平台）
    const platformInfo = initPlatform()
    this.globalData.platformInfo = platformInfo

    // 初始化响应式适配（获取屏幕和导航栏信息）
    initResponsive()

    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      })
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    }
  },

  globalData: {
    userInfo: null,
    openid: null,
    platformInfo: null as PlatformInfo | null,
    // 数据刷新脏标记
    dirtyFlags: {
      fish: false,
      feeding: false,
      waterChange: false,
      equipment: false,
      waterQuality: false,
      tankStats: false,
      tanks: false
    }
  },

  // 标记数据为脏（支持单个或多个类型）
  markDirty(type: DirtyFlagKey | DirtyFlagKey[]) {
    const types = Array.isArray(type) ? type : [type]
    types.forEach(t => {
      this.globalData.dirtyFlags[t] = true
    })
  },

  // 清除脏标记
  clearDirty(type: DirtyFlagKey) {
    this.globalData.dirtyFlags[type] = false
  },

  // 检查是否脏
  isDirty(type: DirtyFlagKey): boolean {
    return this.globalData.dirtyFlags[type]
  }
})
