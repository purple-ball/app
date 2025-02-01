const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    isDarkMode: false,
    themeColor: '#FF69B4',
    themeColors: ['#FF69B4', '#FF1493', '#FF4500', '#FFB6C1', '#FFA07A', '#FF8C00'],
    settings: {
      enableNotification: true,
      enableSound: true,
      enableVibration: true,
      allowStranger: true,
      showOnlineStatus: true
    },
    storageInfo: {
      usedSize: 0,
      totalSize: 0,
      usagePercent: 0
    },
    cacheSize: 0,
    version: '1.0.0'
  },

  onLoad: function () {
    this.setData({
      isLoggedIn: !!app.globalData.userInfo
    })
    this.loadSettings()
    this.getStorageInfo()
    this.getCacheSize()
  },

  // 加载设置
  loadSettings: function () {
    const settings = wx.getStorageSync('settings') || this.data.settings
    const isDarkMode = wx.getStorageSync('isDarkMode') || false
    const themeColor = wx.getStorageSync('themeColor') || this.data.themeColor

    this.setData({
      settings,
      isDarkMode,
      themeColor
    })
  },

  // 切换深色模式
  toggleDarkMode: function (e) {
    const isDarkMode = e.detail.value
    this.setData({ isDarkMode })
    wx.setStorageSync('isDarkMode', isDarkMode)
    
    // 更新全局样式
    if (isDarkMode) {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#000000'
      })
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      })
    }
  },

  // 选择主题色
  selectThemeColor: function (e) {
    const color = e.currentTarget.dataset.color
    this.setData({ themeColor: color })
    wx.setStorageSync('themeColor', color)
    
    // 更新全局样式变量
    app.updateThemeColor(color)
  },

  // 切换通知设置
  toggleNotification: function (e) {
    this.updateSetting('enableNotification', e.detail.value)
  },

  // 切换声音设置
  toggleSound: function (e) {
    this.updateSetting('enableSound', e.detail.value)
  },

  // 切换振动设置
  toggleVibration: function (e) {
    this.updateSetting('enableVibration', e.detail.value)
  },

  // 切换陌生人评论设置
  toggleAllowStranger: function (e) {
    this.updateSetting('allowStranger', e.detail.value)
  },

  // 切换在线状态显示设置
  toggleShowOnlineStatus: function (e) {
    this.updateSetting('showOnlineStatus', e.detail.value)
  },

  // 更新设置
  updateSetting: function (key, value) {
    const settings = this.data.settings
    settings[key] = value
    this.setData({ settings })
    wx.setStorageSync('settings', settings)
  },

  // 获取存储信息
  getStorageInfo: function () {
    wx.getStorageInfo({
      success: res => {
        const usedSize = (res.currentSize / 1024).toFixed(2)
        const totalSize = (res.limitSize / 1024).toFixed(2)
        const usagePercent = (res.currentSize / res.limitSize * 100).toFixed(1)
        
        this.setData({
          storageInfo: {
            usedSize,
            totalSize,
            usagePercent
          }
        })
      }
    })
  },

  // 获取缓存大小
  getCacheSize: function () {
    const size = (Math.random() * 100).toFixed(2) // 模拟缓存大小
    this.setData({ cacheSize: size })
  },

  // 清除缓存
  clearCache: function () {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除缓存吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({
            title: '清除中...'
          })
          
          setTimeout(() => {
            wx.hideLoading()
            this.setData({ cacheSize: 0 })
            wx.showToast({
              title: '清除成功',
              icon: 'success'
            })
          }, 1500)
        }
      }
    })
  },

  // 检查更新
  checkUpdate: function () {
    wx.showLoading({
      title: '检查中...'
    })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '版本信息',
        content: '当前已是最新版本',
        showCancel: false
      })
    }, 1500)
  },

  // 显示关于我们
  showAbout: function () {
    wx.navigateTo({
      url: '/pages/profile/about'
    })
  },

  // 退出登录
  logout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          // 清除用户信息
          app.globalData.userInfo = null
          wx.removeStorageSync('userInfo')
          
          // 返回上一页
          wx.navigateBack()
        }
      }
    })
  }
}) 