const app = getApp()

Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    days: [],
    selectedDate: '',
    selectedIntensity: null,
    symptoms: [
      { name: '腹痛', selected: false },
      { name: '腰痛', selected: false },
      { name: '头痛', selected: false },
      { name: '乳房胀痛', selected: false },
      { name: '疲劳', selected: false },
      { name: '食欲改变', selected: false }
    ],
    moods: [
      { name: '开心', icon: '/images/moods/happy.png' },
      { name: '平静', icon: '/images/moods/calm.png' },
      { name: '焦虑', icon: '/images/moods/anxious.png' },
      { name: '烦躁', icon: '/images/moods/irritated.png' },
      { name: '难过', icon: '/images/moods/sad.png' }
    ],
    selectedMood: '',
    note: '',
    averageCycle: null,
    averagePeriod: null,
    nextPeriod: null
  },

  onLoad: function () {
    this.initCalendar()
    this.loadCycleData()
  },

  // 初始化日历
  initCalendar: function () {
    const date = new Date(this.data.year, this.data.month - 1, 1)
    const days = []
    
    // 获取月初是星期几
    const firstDay = date.getDay()
    
    // 获取月末日期
    const lastDate = new Date(this.data.year, this.data.month, 0).getDate()
    
    // 填充空白日期
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', date: '' })
    }
    
    // 填充日期
    const today = new Date()
    for (let i = 1; i <= lastDate; i++) {
      const currentDate = `${this.data.year}-${this.data.month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`
      days.push({
        day: i,
        date: currentDate,
        isToday: today.getFullYear() === this.data.year && 
                 today.getMonth() + 1 === this.data.month && 
                 today.getDate() === i,
        hasPeriod: false // 这里需要从数据库查询是否有经期记录
      })
    }
    
    this.setData({ days })
  },

  // 加载周期数据
  loadCycleData: function () {
    const db = wx.cloud.database()
    db.collection('cycles')
      .where({
        _openid: app.globalData.openid,
        date: db.RegExp({
          regexp: `${this.data.year}-${this.data.month.toString().padStart(2, '0')}`,
          options: 'i'
        })
      })
      .get()
      .then(res => {
        const days = this.data.days.map(day => {
          if (day.date) {
            const record = res.data.find(r => r.date === day.date)
            return {
              ...day,
              hasPeriod: !!record
            }
          }
          return day
        })
        this.setData({ days })
        this.calculateAnalysis(res.data)
      })
  },

  // 计算周期分析数据
  calculateAnalysis: function (records) {
    if (records && records.length > 1) {
      // 计算平均周期
      let totalDays = 0
      for (let i = 1; i < records.length; i++) {
        const curr = new Date(records[i].date)
        const prev = new Date(records[i-1].date)
        totalDays += Math.abs((curr - prev) / (1000 * 60 * 60 * 24))
      }
      const averageCycle = Math.round(totalDays / (records.length - 1))
      
      // 计算平均经期
      const averagePeriod = Math.round(records.reduce((acc, curr) => acc + curr.duration, 0) / records.length)
      
      // 预测下次经期
      const lastRecord = records[records.length - 1]
      const nextDate = new Date(lastRecord.date)
      nextDate.setDate(nextDate.getDate() + averageCycle)
      
      this.setData({
        averageCycle,
        averagePeriod,
        nextPeriod: `${nextDate.getMonth() + 1}月${nextDate.getDate()}日`
      })
    }
  },

  // 选择日期
  selectDate: function (e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    
    const days = this.data.days.map(day => ({
      ...day,
      isSelected: day.date === date
    }))
    
    this.setData({ 
      days,
      selectedDate: date
    })
    
    // 加载选中日期的记录
    this.loadDateRecord(date)
  },

  // 加载日期记录
  loadDateRecord: function (date) {
    const db = wx.cloud.database()
    db.collection('cycles')
      .where({
        _openid: app.globalData.openid,
        date: date
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const record = res.data[0]
          this.setData({
            selectedIntensity: record.intensity,
            symptoms: this.data.symptoms.map(s => ({
              ...s,
              selected: record.symptoms.includes(s.name)
            })),
            selectedMood: record.mood,
            note: record.note
          })
        } else {
          this.resetForm()
        }
      })
  },

  // 重置表单
  resetForm: function () {
    this.setData({
      selectedIntensity: null,
      symptoms: this.data.symptoms.map(s => ({ ...s, selected: false })),
      selectedMood: '',
      note: ''
    })
  },

  // 选择经期强度
  selectIntensity: function (e) {
    const intensity = parseInt(e.currentTarget.dataset.intensity)
    this.setData({ selectedIntensity: intensity })
  },

  // 切换症状
  toggleSymptom: function (e) {
    const name = e.currentTarget.dataset.name
    const symptoms = this.data.symptoms.map(s => {
      if (s.name === name) {
        return { ...s, selected: !s.selected }
      }
      return s
    })
    this.setData({ symptoms })
  },

  // 选择情绪
  selectMood: function (e) {
    const mood = e.currentTarget.dataset.mood
    this.setData({ selectedMood: mood })
  },

  // 更新备注
  updateNote: function (e) {
    this.setData({ note: e.detail.value })
  },

  // 切换月份
  prevMonth: function () {
    let { year, month } = this.data
    if (month === 1) {
      year--
      month = 12
    } else {
      month--
    }
    this.setData({ year, month }, () => {
      this.initCalendar()
      this.loadCycleData()
    })
  },

  nextMonth: function () {
    let { year, month } = this.data
    if (month === 12) {
      year++
      month = 1
    } else {
      month++
    }
    this.setData({ year, month }, () => {
      this.initCalendar()
      this.loadCycleData()
    })
  },

  // 保存记录
  saveRecord: function () {
    if (!this.data.selectedDate) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      })
      return
    }

    const record = {
      date: this.data.selectedDate,
      intensity: this.data.selectedIntensity,
      symptoms: this.data.symptoms.filter(s => s.selected).map(s => s.name),
      mood: this.data.selectedMood,
      note: this.data.note
    }

    const db = wx.cloud.database()
    db.collection('cycles')
      .where({
        _openid: app.globalData.openid,
        date: this.data.selectedDate
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          // 更新记录
          db.collection('cycles')
            .doc(res.data[0]._id)
            .update({
              data: record
            })
            .then(() => {
              this.showSuccess()
            })
        } else {
          // 新增记录
          db.collection('cycles')
            .add({
              data: record
            })
            .then(() => {
              this.showSuccess()
            })
        }
      })
  },

  showSuccess: function () {
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
    this.loadCycleData()
  }
}) 