// pages/community/community.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    categories: [
      { id: 'all', name: '全部' },
      { id: 'share', name: '经验分享' },
      { id: 'question', name: '疑问解答' },
      { id: 'support', name: '情感支持' },
      { id: 'medical', name: '就医建议' },
      { id: 'career', name: '职场交流' }
    ],
    selectedCategory: 'all',
    posts: [],
    isLoading: false,
    noMore: false,
    showPostModal: false,
    newPost: {
      categoryId: '',
      title: '',
      content: '',
      images: [],
      isAnonymous: false
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadPosts()
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
    this.loadPosts(true)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.noMore) {
      this.loadMorePosts()
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 加载帖子列表
  loadPosts: function (isPullDown = false) {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })
    
    const db = wx.cloud.database()
    const query = this.data.selectedCategory === 'all' 
      ? {} 
      : { category: this.data.selectedCategory }

    db.collection('posts')
      .where(query)
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()
      .then(res => {
        const posts = res.data.map(post => ({
          ...post,
          createTime: this.formatTime(post.createTime)
        }))
        
        this.setData({
          posts,
          isLoading: false,
          noMore: posts.length < 10
        })

        if (isPullDown) {
          wx.stopPullDownRefresh()
        }
      })
      .catch(err => {
        console.error('加载帖子失败：', err)
        this.setData({ isLoading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  // 加载更多帖子
  loadMorePosts: function () {
    if (this.data.isLoading || this.data.noMore) return

    this.setData({ isLoading: true })

    const db = wx.cloud.database()
    const query = this.data.selectedCategory === 'all' 
      ? {} 
      : { category: this.data.selectedCategory }

    db.collection('posts')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(this.data.posts.length)
      .limit(10)
      .get()
      .then(res => {
        const newPosts = res.data.map(post => ({
          ...post,
          createTime: this.formatTime(post.createTime)
        }))
        
        this.setData({
          posts: [...this.data.posts, ...newPosts],
          isLoading: false,
          noMore: newPosts.length < 10
        })
      })
      .catch(err => {
        console.error('加载更多帖子失败：', err)
        this.setData({ isLoading: false })
      })
  },

  // 选择分类
  selectCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ 
      selectedCategory: categoryId,
      posts: [],
      noMore: false
    }, () => {
      this.loadPosts()
    })
  },

  // 显示发帖弹窗
  showPostModal: function () {
    this.setData({ 
      showPostModal: true,
      newPost: {
        categoryId: '',
        title: '',
        content: '',
        images: [],
        isAnonymous: false
      }
    })
  },

  // 隐藏发帖弹窗
  hidePostModal: function () {
    this.setData({ showPostModal: false })
  },

  // 选择发帖分类
  selectPostCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      'newPost.categoryId': categoryId
    })
  },

  // 更新帖子标题
  updatePostTitle: function (e) {
    this.setData({
      'newPost.title': e.detail.value
    })
  },

  // 更新帖子内容
  updatePostContent: function (e) {
    this.setData({
      'newPost.content': e.detail.value
    })
  },

  // 选择图片
  chooseImage: function () {
    const count = 9 - this.data.newPost.images.length
    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        // 上传图片到云存储
        const uploadTasks = res.tempFilePaths.map(path => this.uploadImage(path))
        
        Promise.all(uploadTasks)
          .then(fileIds => {
            this.setData({
              'newPost.images': [...this.data.newPost.images, ...fileIds]
            })
          })
          .catch(err => {
            console.error('上传图片失败：', err)
            wx.showToast({
              title: '上传图片失败',
              icon: 'none'
            })
          })
      }
    })
  },

  // 上传图片到云存储
  uploadImage: function (filePath) {
    return new Promise((resolve, reject) => {
      const ext = filePath.split('.').pop()
      const cloudPath = `posts/${Date.now()}-${Math.random().toString(36).substr(2)}.${ext}`
      
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: res => resolve(res.fileID),
        fail: err => reject(err)
      })
    })
  },

  // 删除图片
  deleteImage: function (e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.newPost.images
    images.splice(index, 1)
    this.setData({
      'newPost.images': images
    })
  },

  // 切换匿名发布
  toggleAnonymous: function (e) {
    this.setData({
      'newPost.isAnonymous': e.detail.value
    })
  },

  // 提交帖子
  submitPost: function () {
    if (!this.data.newPost.categoryId) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      })
      return
    }

    if (!this.data.newPost.content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    const db = wx.cloud.database()
    const post = {
      ...this.data.newPost,
      createTime: db.serverDate(),
      author: this.data.newPost.isAnonymous ? null : {
        _openid: app.globalData.openid,
        nickName: app.globalData.userInfo.nickName,
        avatarUrl: app.globalData.userInfo.avatarUrl
      },
      likeCount: 0,
      commentCount: 0
    }

    db.collection('posts')
      .add({
        data: post
      })
      .then(() => {
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        })
        this.hidePostModal()
        this.loadPosts()
      })
      .catch(err => {
        console.error('发布帖子失败：', err)
        wx.showToast({
          title: '发布失败',
          icon: 'none'
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

  // 预览图片
  previewImage: function (e) {
    const current = e.currentTarget.dataset.current
    const urls = e.currentTarget.dataset.urls
    wx.previewImage({ current, urls })
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