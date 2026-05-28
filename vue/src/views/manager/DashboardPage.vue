<template>
  <div class="statistics-container">
    <!-- 顶部统计卡片 -->
    <div class="card-wrap">
      <div class="stat-card" v-for="item in statList" :key="item.title">
        <div class="title">{{ item.title }}</div>
        <div class="num">{{ item.num }}</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <!-- 资源类型分布 饼图/柱状图 -->
      <div class="chart-box">
        <div class="chart-title">资源类型分布统计</div>
        <div id="resourceChart" class="chart-content"></div>
      </div>

      <!-- 月度共享活跃度 折线图 -->
      <div class="chart-box">
        <div class="chart-title">月度资源共享活跃度</div>
        <div id="monthChart" class="chart-content"></div>
      </div>
    </div>

    <!-- 用户行为统计柱状图 -->
    <div class="chart-box full-box">
      <div class="chart-title">平台用户行为数据统计</div>
      <div id="behaviorChart" class="chart-content"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import axios from '@/utils/request'

// 统计卡片数据
const statList = ref([
  { title: '平台总用户', num: 0 },
  { title: '上架资源总数', num: 0 },
  { title: '交易订单总数', num: 0 },
  { title: '用户评价总数', num: 0 }
])

let resourceEchart = null
let monthEchart = null
let behaviorEchart = null

// 获取顶部概览数据
const getOverview = async () => {
  const res = await axios.get('/statistics/overview')
  if (res.code === "200") {
    statList.value[0].num = res.data.userCount
    statList.value[1].num = res.data.resourceCount
    statList.value[2].num = res.data.transactionCount
    statList.value[3].num = res.data.evaluateCount
  }
}

// 初始化资源类型饼图
const initResourceChart = async () => {
  const res = await axios.get('/statistics/resourceTypeCount')
  if (res.code !== "200") return
  const data = res.data
  //const nameArr = data.map(item => item.name)
  //const valueArr = data.map(item => item.value)

  resourceEchart = echarts.init(document.getElementById('resourceChart'))
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '资源类型',
        type: 'pie',
        radius: '70%',
        data: data
      }
    ]
  }
  resourceEchart.setOption(option)
  window.addEventListener('resize', () => resourceEchart.resize())
}

// 初始化月度活跃度折线图
const initMonthChart = async () => {
  const res = await axios.get('/statistics/monthlyActivity')
  if (res.code !== "200") return
  const data = res.data
  const xAxisData = data.map(item => item.month)
  const seriesData = data.map(item => item.count)

  monthEchart = echarts.init(document.getElementById('monthChart'))
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xAxisData },
    yAxis: { type: 'value' },
    series: [
      {
        name: '月度发布量',
        type: 'line',
        smooth: true,
        data: seriesData
      }
    ]
  }
  monthEchart.setOption(option)
  window.addEventListener('resize', () => monthEchart.resize())
}

// 初始化用户行为柱状图
const initBehaviorChart = async () => {
  const res = await axios.get('/statistics/userBehaviorCount')
  if (res.code !== "200") return
  const data = res.data

  behaviorEchart = echarts.init(document.getElementById('behaviorChart'))
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['资源访问量', '收藏总量', '评论总量']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '行为统计',
        type: 'bar',
        data: [data.viewCount, data.collectCount, data.commentCount]
      }
    ]
  }
  behaviorEchart.setOption(option)
  window.addEventListener('resize', () => behaviorEchart.resize())
}

onMounted(() => {
  getOverview()
  initResourceChart()
  initMonthChart()
  initBehaviorChart()
})
</script>

<style scoped>
.statistics-container {
  background: #f5f5f5;
  min-height: 100vh;
}
.card-wrap {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.stat-card {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.stat-card .title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}
.stat-card .num {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}
.chart-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.chart-box {
  flex: 1;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.full-box {
}
.chart-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #333;
}
.chart-content {
  width: 100%;
  height: 350px;
}
</style>