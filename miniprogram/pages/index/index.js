const app = getApp()

Page({
  data: {
    userInfo: null,
    cycleData: null,
    tasks: [
      {
        id: 1,
        text: '记录今日情绪',
        points: 5,
        completed: false
      },
      {
        id: 2,
        text: '完成每日冥想',
        points: 10,
        completed: false
      },
      {
        id: 3,
        text: '阅读健康知识',
        points: 8,
        completed: false
      }
    ],
    reminder: null,
    posts: []
  },

  onLoad: function () {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    
    // 获取周期数据
    this.getCycleData()
    
    // 获取社区动态
    this.getCommunityPosts()
    
    // 检查是否有健康提醒
    this.checkHealthReminder()
  },

  onShow: function () {
    // 页面显示时刷新数据
    if (app.globalData.userInfo && !this.data.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 获取周期数据
  getCycleData: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    
    const db = wx.cloud.database()
    db.collection('cycles')
      .orderBy('date', 'desc')
      .limit(1)
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const cycleData = this.calculateCyclePhase(res.data[0])
          this.setData({ cycleData })
        }
      })
      .catch(err => {
        console.error('获取周期数据失败：', err)
        // 显示错误提示
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      })
  },

  // 计算周期阶段
  calculateCyclePhase: function (cycleData) {
    const now = new Date()
    const cycleStart = new Date(cycleData.date)
    const dayCount = Math.floor((now - cycleStart) / (24 * 60 * 60 * 1000)) + 1
    
    let currentPhase = ''
    if (dayCount <= 5) {
      currentPhase = '月经期'
    } else if (dayCount <= 14) {
      currentPhase = '卵泡期'
    } else if (dayCount <= 16) {
      currentPhase = '排卵期'
    } else {
      currentPhase = '黄体期'
    }

    return {
      ...cycleData,
      dayCount,
      currentPhase
    }
  },

  // 获取社区动态
  getCommunityPosts: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    const db = wx.cloud.database()
    db.collection('posts')
      .orderBy('createTime', 'desc')
      .limit(3)
      .get()
      .then(res => {
        this.setData({
          posts: res.data
        })
      })
      .catch(err => {
        console.error('获取社区动态失败：', err)
        // 显示错误提示
        wx.showToast({
          title: '社区数据加载失败',
          icon: 'none'
        })
      })
  },

  // 检查健康提醒
  checkHealthReminder: function () {
    // 这里可以根据用户的周期数据和设置来生成健康提醒
    const reminder = {
      time: '今天',
      content: '距离下次月经还有3天，记得准备卫生用品哦～'
    }
    this.setData({ reminder })
  },

  // 切换任务完成状态
  toggleTask: function (e) {
    const taskId = e.currentTarget.dataset.id
    const tasks = this.data.tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed }
      }
      return task
    })
    this.setData({ tasks })
  },

  // 处理提醒
  handleReminder: function () {
    // 处理提醒的具体逻辑
    wx.showToast({
      title: '已添加到购物清单',
      icon: 'success'
    })
    this.setData({ reminder: null })
  },

  // 延迟提醒
  dismissReminder: function () {
    this.setData({ reminder: null })
    // 可以设置稍后再次提醒的逻辑
  },

  // 页面跳转
  navigateTo: function (e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  onShareAppMessage: function () {
    return {
      title: 'HerSpace - 你的贴心女性健康助手',
      path: '/pages/index/index'
    }
  }
}) 