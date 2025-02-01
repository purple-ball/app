const app = getApp()

Page({
  data: {
    userInfo: null,
    genderOptions: ['保密', '女', '男']
  },

  onLoad: function () {
    // 获取用户信息
    const userInfo = app.globalData.userInfo || {}
    // 补充其他字段
    userInfo.gender = userInfo.gender || 0
    userInfo.birthday = userInfo.birthday || ''
    userInfo.bio = userInfo.bio || ''
    userInfo.isPublic = userInfo.isPublic === undefined ? true : userInfo.isPublic

    this.setData({ userInfo })
  },

  // 选择头像
  chooseAvatar: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0]
        
        // 上传头像到云存储
        wx.showLoading({ title: '上传中...' })
        
        const cloudPath = `avatars/${app.globalData.openid}-${Date.now()}.${tempFilePath.match(/\.(\w+)$/)[1]}`
        
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
          success: res => {
            this.setData({
              'userInfo.avatarUrl': res.fileID
            })
            wx.hideLoading()
          },
          fail: err => {
            console.error('上传头像失败：', err)
            wx.hideLoading()
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
        })
      }
    })
  },

  // 更新昵称
  updateNickName: function (e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  },

  // 更新性别
  updateGender: function (e) {
    this.setData({
      'userInfo.gender': parseInt(e.detail.value)
    })
  },

  // 更新生日
  updateBirthday: function (e) {
    this.setData({
      'userInfo.birthday': e.detail.value
    })
  },

  // 更新个人简介
  updateBio: function (e) {
    this.setData({
      'userInfo.bio': e.detail.value
    })
  },

  // 切换公开设置
  togglePublic: function (e) {
    this.setData({
      'userInfo.isPublic': e.detail.value
    })
  },

  // 保存资料
  saveProfile: function () {
    if (!this.data.userInfo.nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const db = wx.cloud.database()
    db.collection('users').doc(app.globalData.openid).set({
      data: {
        nickName: this.data.userInfo.nickName,
        avatarUrl: this.data.userInfo.avatarUrl,
        gender: this.data.userInfo.gender,
        birthday: this.data.userInfo.birthday,
        bio: this.data.userInfo.bio,
        isPublic: this.data.userInfo.isPublic,
        updateTime: db.serverDate()
      }
    }).then(() => {
      // 更新全局用户信息
      app.globalData.userInfo = this.data.userInfo
      wx.setStorageSync('userInfo', this.data.userInfo)

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      console.error('保存资料失败：', err)
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    })
  }
}) 