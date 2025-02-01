const app = getApp()

Page({
  data: {
    postId: '',
    post: null,
    comments: [],
    isLiked: false,
    commentContent: '',
    showCommentInput: false,
    replyTo: null,
    isIphoneX: false
  },

  onLoad: function (options) {
    this.setData({ 
      postId: options.id,
      isIphoneX: app.globalData.isIphoneX
    })
    this.loadPost()
    this.loadComments()
  },

  // 加载帖子详情
  loadPost: function () {
    const db = wx.cloud.database()
    db.collection('posts')
      .doc(this.data.postId)
      .get()
      .then(res => {
        const post = {
          ...res.data,
          createTime: this.formatTime(res.data.createTime)
        }
        this.setData({ 
          post,
          isLiked: this.checkIsLiked(post)
        })
      })
      .catch(err => {
        console.error('加载帖子失败：', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  // 加载评论列表
  loadComments: function () {
    const db = wx.cloud.database()
    db.collection('comments')
      .where({
        postId: this.data.postId
      })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const comments = res.data.map(comment => ({
          ...comment,
          createTime: this.formatTime(comment.createTime),
          isLiked: this.checkIsLiked(comment)
        }))
        this.setData({ comments })
      })
      .catch(err => {
        console.error('加载评论失败：', err)
      })
  },

  // 点赞/取消点赞
  toggleLike: function () {
    const db = wx.cloud.database()
    const _ = db.command
    const post = this.data.post
    const isLiked = !this.data.isLiked

    // 更新点赞数
    db.collection('posts')
      .doc(post._id)
      .update({
        data: {
          likeCount: isLiked ? _.inc(1) : _.inc(-1)
        }
      })
      .then(() => {
        // 更新点赞记录
        const likeCollection = db.collection('likes')
        if (isLiked) {
          likeCollection.add({
            data: {
              targetId: post._id,
              targetType: 'post',
              createTime: db.serverDate()
            }
          })
        } else {
          likeCollection.where({
            targetId: post._id,
            targetType: 'post',
            _openid: app.globalData.openid
          }).remove()
        }

        this.setData({
          isLiked,
          'post.likeCount': isLiked ? (post.likeCount || 0) + 1 : (post.likeCount || 1) - 1
        })
      })
  },

  // 显示评论输入框
  showReplyInput: function (e) {
    const commentId = e.currentTarget.dataset.id
    const comment = this.data.comments.find(c => c._id === commentId)
    this.setData({
      showCommentInput: true,
      replyTo: comment
    })
  },

  // 隐藏评论输入框
  hideCommentInput: function () {
    setTimeout(() => {
      this.setData({
        showCommentInput: false,
        replyTo: null,
        commentContent: ''
      })
    }, 100)
  },

  // 更新评论内容
  updateCommentContent: function (e) {
    this.setData({
      commentContent: e.detail.value
    })
  },

  // 提交评论
  submitComment: function () {
    if (!this.data.commentContent.trim()) {
      return
    }

    const db = wx.cloud.database()
    const comment = {
      postId: this.data.postId,
      content: this.data.commentContent,
      createTime: db.serverDate(),
      author: {
        _openid: app.globalData.openid,
        nickName: app.globalData.userInfo.nickName,
        avatarUrl: app.globalData.userInfo.avatarUrl
      },
      likeCount: 0
    }

    // 如果是回复评论
    if (this.data.replyTo) {
      comment.replyTo = {
        commentId: this.data.replyTo._id,
        author: this.data.replyTo.author
      }
    }

    db.collection('comments')
      .add({
        data: comment
      })
      .then(() => {
        // 更新帖子评论数
        db.collection('posts')
          .doc(this.data.postId)
          .update({
            data: {
              commentCount: db.command.inc(1)
            }
          })

        wx.showToast({
          title: '评论成功',
          icon: 'success'
        })

        this.setData({
          commentContent: '',
          showCommentInput: false,
          replyTo: null
        })

        // 重新加载评论列表
        this.loadComments()
        // 更新帖子信息
        this.loadPost()
      })
      .catch(err => {
        console.error('提交评论失败：', err)
        wx.showToast({
          title: '评论失败',
          icon: 'none'
        })
      })
  },

  // 点赞评论
  likeComment: function (e) {
    const commentId = e.currentTarget.dataset.id
    const comment = this.data.comments.find(c => c._id === commentId)
    const isLiked = !comment.isLiked

    const db = wx.cloud.database()
    const _ = db.command

    // 更新评论点赞数
    db.collection('comments')
      .doc(commentId)
      .update({
        data: {
          likeCount: isLiked ? _.inc(1) : _.inc(-1)
        }
      })
      .then(() => {
        // 更新点赞记录
        const likeCollection = db.collection('likes')
        if (isLiked) {
          likeCollection.add({
            data: {
              targetId: commentId,
              targetType: 'comment',
              createTime: db.serverDate()
            }
          })
        } else {
          likeCollection.where({
            targetId: commentId,
            targetType: 'comment',
            _openid: app.globalData.openid
          }).remove()
        }

        // 更新本地数据
        const comments = this.data.comments.map(c => {
          if (c._id === commentId) {
            return {
              ...c,
              isLiked,
              likeCount: isLiked ? (c.likeCount || 0) + 1 : (c.likeCount || 1) - 1
            }
          }
          return c
        })
        this.setData({ comments })
      })
  },

  // 预览图片
  previewImage: function (e) {
    const current = e.currentTarget.dataset.current
    const urls = e.currentTarget.dataset.urls
    wx.previewImage({ current, urls })
  },

  // 检查是否已点赞
  checkIsLiked: function (target) {
    const db = wx.cloud.database()
    return new Promise((resolve) => {
      db.collection('likes')
        .where({
          targetId: target._id,
          _openid: app.globalData.openid
        })
        .count()
        .then(res => {
          resolve(res.total > 0)
        })
        .catch(() => {
          resolve(false)
        })
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
  },

  onShareAppMessage: function () {
    return {
      title: this.data.post.title || this.data.post.content.substring(0, 50),
      path: `/pages/community/detail?id=${this.data.postId}`
    }
  }
}) 