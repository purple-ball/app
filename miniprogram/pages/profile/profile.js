// pages/profile/profile.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    stats: {
      postCount: 0,
      commentCount: 0,
      likeCount: 0
    },
    activeTab: 'posts',
    posts: [],
    comments: [],
    likes: [],
    isLoading: false,
    noMore: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取用户信息
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo })
      this.loadUserStats()
      this.loadContent()
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (this.data.userInfo) {
      this.loadUserStats()
      this.loadContent()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    if (!this.data.userInfo) {
      wx.stopPullDownRefresh()
      return
    }

    this.setData({
      posts: [],
      comments: [],
      likes: [],
      noMore: false
    }, () => {
      Promise.all([
        this.loadUserStats(),
        this.loadContent()
      ]).then(() => {
        wx.stopPullDownRefresh()
      })
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.noMore) {
      this.loadContent()
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 登录
  login: function () {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        app.globalData.userInfo = res.userInfo
        this.setData({ userInfo: res.userInfo })
        this.loadUserStats()
        this.loadContent()
      }
    })
  },

  // 加载用户统计数据
  loadUserStats: function () {
    const db = wx.cloud.database()
    const _ = db.command

    // 获取发帖数
    db.collection('posts')
      .where({
        '_openid': app.globalData.openid
      })
      .count()
      .then(res => {
        this.setData({
          'stats.postCount': res.total
        })
      })

    // 获取评论数
    db.collection('comments')
      .where({
        '_openid': app.globalData.openid
      })
      .count()
      .then(res => {
        this.setData({
          'stats.commentCount': res.total
        })
      })

    // 获取获赞数
    db.collection('likes')
      .where({
        targetId: _.in(this.data.posts.map(p => p._id))
      })
      .count()
      .then(res => {
        this.setData({
          'stats.likeCount': res.total
        })
      })
  },

  // 切换选项卡
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab,
      posts: [],
      comments: [],
      likes: [],
      noMore: false
    }, () => {
      this.loadContent()
    })
  },

  // 加载内容
  loadContent: function () {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    const db = wx.cloud.database()
    let promise

    switch (this.data.activeTab) {
      case 'posts':
        promise = this.loadPosts(db)
        break
      case 'comments':
        promise = this.loadComments(db)
        break
      case 'likes':
        promise = this.loadLikes(db)
        break
    }

    promise.then(() => {
      this.setData({ isLoading: false })
    }).catch(err => {
      console.error('加载内容失败：', err)
      this.setData({ isLoading: false })
    })
  },

  // 加载帖子
  loadPosts: function (db) {
    return db.collection('posts')
      .where({
        '_openid': app.globalData.openid
      })
      .orderBy('createTime', 'desc')
      .skip(this.data.posts.length)
      .limit(10)
      .get()
      .then(res => {
        const posts = res.data.map(post => ({
          ...post,
          createTime: this.formatTime(post.createTime)
        }))
        
        this.setData({
          posts: [...this.data.posts, ...posts],
          noMore: posts.length < 10
        })
      })
  },

  // 加载评论
  loadComments: function (db) {
    return db.collection('comments')
      .where({
        '_openid': app.globalData.openid
      })
      .orderBy('createTime', 'desc')
      .skip(this.data.comments.length)
      .limit(10)
      .get()
      .then(res => {
        // 获取评论对应的帖子内容
        const postIds = res.data.map(c => c.postId)
        return db.collection('posts')
          .where({
            _id: db.command.in(postIds)
          })
          .get()
          .then(postRes => {
            const posts = postRes.data
            const comments = res.data.map(comment => ({
              ...comment,
              createTime: this.formatTime(comment.createTime),
              post: posts.find(p => p._id === comment.postId)
            }))
            
            this.setData({
              comments: [...this.data.comments, ...comments],
              noMore: comments.length < 10
            })
          })
      })
  },

  // 加载点赞
  loadLikes: function (db) {
    return db.collection('likes')
      .where({
        '_openid': app.globalData.openid
      })
      .orderBy('createTime', 'desc')
      .skip(this.data.likes.length)
      .limit(10)
      .get()
      .then(res => {
        // 获取点赞对应的内容
        const promises = res.data.map(like => {
          const collection = like.targetType === 'post' ? 'posts' : 'comments'
          return db.collection(collection)
            .doc(like.targetId)
            .get()
            .then(targetRes => ({
              ...like,
              createTime: this.formatTime(like.createTime),
              target: targetRes.data
            }))
        })

        return Promise.all(promises).then(likes => {
          this.setData({
            likes: [...this.data.likes, ...likes],
            noMore: likes.length < 10
          })
        })
      })
  },

  // 跳转到帖子详情
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/community/detail?id=${id}`
    })
  },

  // 格式化时间
  formatTime: function (date) {
    date = new Date(date)
    const now = new Date()
    const diff = (now - date) / 1000

    if (diff < 60) {
      return '刚刚'
    } else if (diff < 3600) {
      return Math.floor(diff / 60) + '分钟前'
    } else if (diff < 86400) {
      return Math.floor(diff / 3600) + '小时前'
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }
})