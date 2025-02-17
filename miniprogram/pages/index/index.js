const app = getApp()

// 女性主义名言数据
const feministQuotes = [
  {
    content: "我们不是生来就是女人，而是成为女人。",
    author: "西蒙·波伏娃"
  },
  {
    content: "没有限制我们的高度，只有限制我们想象力的天空。",
    author: "玛丽·沃斯通克拉夫特"
  },
  {
    content: "一个女人要像一杯茶，安静中带着骨气。",
    author: "张爱玲"
  },
  {
    content: "女性的价值不应由他人来定义，而应由自己来书写。",
    author: "弗吉尼亚·伍尔夫"
  },
  {
    content: "教育女孩，就是教育整个民族。",
    author: "艾玛·沃森"
  }
]

// 信物奖励数据
const rewards = [
  {
    id: 'white_carnation',
    name: '白色康乃馨',
    image: '/images/rewards/white_carnation.png',
    description: '象征着纯洁的爱与平等。这朵花代表着对所有女性的尊重与关爱。'
  },
  {
    id: 'violet',
    name: '紫罗兰',
    image: '/images/rewards/violet.png',
    description: '代表着谦逊与坚韧。这是一朵象征女性力量的花，静默绽放却永不言弃。'
  },
  {
    id: 'rose',
    name: '玫瑰',
    image: '/images/rewards/rose.png',
    description: '象征着热情与自由。每一片花瓣都诉说着对自由与权利的渴望。'
  },
  {
    id: 'lavender',
    name: '薰衣草',
    image: '/images/rewards/lavender.png',
    description: '代表着优雅与独立。散发着淡雅芬芳，却有着不屈的生命力。'
  },
  {
    id: 'ceiba',
    name: '木棉花',
    image: '/images/rewards/ceiba.png',
    description: '象征着勇气与坚强。高耸入云，不畏风雨，是女性精神的完美写照。'
  },
  {
    id: 'camellia',
    name: '山茶花',
    image: '/images/rewards/camellia.png',
    description: '代表着坚持与绽放。在寒冷中依然绽放，展现出女性的坚韧之美。'
  }
]

Page({
  data: {
    userInfo: null,
    cycleData: null,
    tasks: [
      { id: 1, text: '记录今日心情', completed: false },
      { id: 2, text: '完成一次冥想', completed: false },
      { id: 3, text: '阅读一篇文章', completed: false },
      { id: 4, text: '记录生理状况', completed: false }
    ],
    reminder: null,
    posts: [],
    quote: feministQuotes[0],
    showReward: false,
    currentReward: null,
    showTaskModal: false,
    editMode: 'add', // 'add' 或 'edit'
    editingTask: {
      id: null,
      text: ''
    }
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }

    // 随机选择一条名言
    const randomQuote = feministQuotes[Math.floor(Math.random() * feministQuotes.length)]
    this.setData({ quote: randomQuote })

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

  // 切换任务状态
  toggleTask(e) {
    const taskId = e.currentTarget.dataset.id
    const tasks = this.data.tasks.map(task => {
      if (task.id === taskId) {
        const completed = !task.completed
        // 如果任务完成，随机给予奖励
        if (completed) {
          this.giveRandomReward()
        }
        return { ...task, completed }
      }
      return task
    })

    this.setData({ tasks })
  },

  // 随机发放奖励
  giveRandomReward() {
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)]
    this.setData({
      currentReward: randomReward,
      showReward: true
    })
  },

  // 关闭奖励弹窗
  closeReward() {
    this.setData({
      showReward: false
    })
  },

  // 查看奖励详情
  viewRewardDetail() {
    const { currentReward } = this.data
    wx.navigateTo({
      url: `/pages/reward/detail?id=${currentReward.id}`
    })
  },

  // 导航到个人页面
  navigateToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },

  // 处理快捷功能点击
  handleGridItemTap(e) {
    const type = e.currentTarget.dataset.type
    const routes = {
      diary: '/pages/diary/index',
      record: '/pages/record/index',
      knowledge: '/pages/knowledge/index',
      sos: '/pages/sos/index'
    }

    if (routes[type]) {
      wx.navigateTo({
        url: routes[type]
      })
    }
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
  },

  // 显示任务编辑弹窗
  showTaskModal: function(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === 'edit') {
      const task = e.currentTarget.dataset.task
      this.setData({
        editMode: 'edit',
        editingTask: { ...task }
      })
    } else {
      this.setData({
        editMode: 'add',
        editingTask: {
          id: null,
          text: ''
        }
      })
    }
    this.setData({ showTaskModal: true })
  },

  // 隐藏任务编辑弹窗
  hideTaskModal: function() {
    this.setData({ showTaskModal: false })
  },

  // 更新任务内容
  updateTaskText: function(e) {
    this.setData({
      'editingTask.text': e.detail.value
    })
  },

  // 保存任务
  saveTask: function() {
    const { editingTask, editMode, tasks } = this.data
    
    if (!editingTask.text) {
      wx.showToast({
        title: '请输入任务内容',
        icon: 'none'
      })
      return
    }

    let newTasks = [...tasks]
    
    if (editMode === 'add') {
      // 生成新的任务ID
      const maxId = Math.max(...tasks.map(t => t.id), 0)
      editingTask.id = maxId + 1
      editingTask.completed = false
      newTasks.push(editingTask)
    } else {
      // 更新已有任务
      const index = tasks.findIndex(t => t.id === editingTask.id)
      if (index !== -1) {
        newTasks[index] = {
          ...tasks[index],
          text: editingTask.text
        }
      }
    }

    this.setData({
      tasks: newTasks,
      showTaskModal: false
    })

    wx.showToast({
      title: editMode === 'add' ? '添加成功' : '更新成功',
      icon: 'success'
    })
  },

  // 删除任务
  deleteTask: function(e) {
    const taskId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '删除任务',
      content: '确定要删除这个任务吗？',
      success: res => {
        if (res.confirm) {
          const newTasks = this.data.tasks.filter(t => t.id !== taskId)
          this.setData({ tasks: newTasks })
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  }
}) 