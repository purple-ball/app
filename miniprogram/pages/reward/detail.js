// pages/reward/detail.js
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

  /**
   * 页面的初始数据
   */
  data: {
    reward: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 根据传入的id获取对应的信物信息
    const reward = rewards.find(r => r.id === options.id)
    if (reward) {
      this.setData({ reward })
    } else {
      wx.showToast({
        title: '信物不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { reward } = this.data
    return {
      title: `我获得了一个特别的信物：${reward.name}`,
      path: `/pages/reward/detail?id=${reward.id}`,
      imageUrl: reward.image
    }
  }
})