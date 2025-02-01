App({
  globalData: {
    userInfo: null,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    // 全局状态管理
    cycleData: null,
    emotionData: null,
    // 主题配置
    theme: {
      primaryColor: '#FF69B4',
      secondaryColor: '#FFB6C1',
      backgroundColor: '#FFF0F5'
    }
  },
  onLaunch: function () {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'your-env-id',
        traceUser: true
      })
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              this.globalData.hasUserInfo = true
            }
          })
        }
      }
    })

    // 检查更新
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate(function (res) {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(function () {
          wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: function (res) {
              if (res.confirm) {
                updateManager.applyUpdate()
              }
            }
          })
        })
      }
    })
  }
}) 