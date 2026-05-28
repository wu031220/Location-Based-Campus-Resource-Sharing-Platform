<template>
  <div class="resource-list">
    <!-- 顶部筛选栏 -->
    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchForm.keyword" placeholder="搜索资源" clearable />
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.type" placeholder="资源类型" clearable>
            <el-option label="教材" value="1" />
            <el-option label="闲置物品" value="2" />
            <el-option label="运动器材" value="3" />
            <el-option label="自习座位" value="4" />
            <el-option label="共享雨伞" value="5" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.shareType" placeholder="共享方式" clearable>
            <el-option label="免费借用" value="1" />
            <el-option label="付费租赁" value="2" />
            <el-option label="交换" value="3" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.distance" placeholder="距离范围">
            <el-option label="500米内" value="500" />
            <el-option label="1000米内" value="1000" />
            <el-option label="2000米内" value="2000" />
            <el-option label="全校园" value="" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="search">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button @click="toggleMap">
            {{ showMap ? '隐藏地图' : '显示地图' }}
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 地图展示（使用高德地图组件） -->
    <el-card v-if="showMap" class="map-card">
      <AMapView
          :center="userLocation"
          :zoom="15"
          :markers="mapMarkers"
          :enableGeolocation="true"
          @location-success="onLocationSuccess"
      />
    </el-card>

    <!-- 资源卡片列表 -->
    <div class="resource-cards">
      <el-row :gutter="20">
        <el-col
            v-for="item in resourceList"
            :key="item.id"
            :xs="24" :sm="12" :md="8" :lg="6"
        >
          <el-card class="resource-card" @click="goDetail(item.id)">
            <img :src="item.images?.[0] || defaultImg" class="card-img" />
            <div class="card-info">
              <h3>{{ item.title }}</h3>
              <p>距离：{{ item.distance }}米</p>
              <p>信用分：{{ item.creditScore }}</p>
              <el-tag :type="item.shareType === 1 ? 'success' : 'warning'">
                {{ shareTypeMap[item.shareType] }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadResources"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'  // 导入 computed
import { useRouter } from 'vue-router'
import AMapView from '@/components/AMapView.vue'
import axios from '@/utils/request'

const router = useRouter()
const userLocation = ref([108.948024, 34.263161]) // 默认中心坐标（长安大学）
const searchForm = ref({
  keyword: '',
  type: '',
  shareType: '',
  distance: ''
})
const resourceList = ref([])   // 资源列表
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const showMap = ref(false)     // 控制地图显示
const defaultImg = 'https://via.placeholder.com/200'

const shareTypeMap = {
  1: '免费借用',
  2: '付费租赁',
  3: '交换'
}

// 计算地图标记点（当 resourceList 变化时自动更新）
const mapMarkers = computed(() => {
  return resourceList.value.map(r => ({
    lng: r.location.lng,      // 假设后端返回的 location 对象包含 lng, lat
    lat: r.location.lat,
    title: r.title,
    description: r.description || ''
  }))
})

// 加载资源列表
const loadResources = async () => {
  const params = {
    page: page.value,
    size: pageSize.value,
    ...searchForm.value
  }
  try {
    const res = await axios.get('/api/resource/nearby', { params })
    resourceList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('加载资源失败', error)
  }
}

// 搜索
const search = () => {
  page.value = 1
  loadResources()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.value = { keyword: '', type: '', shareType: '', distance: '' }
  search()
}

// 跳转详情
const goDetail = (id) => {
  router.push(`/resource/detail/${id}`)
}

// 切换地图显示
const toggleMap = () => {
  showMap.value = !showMap.value
}

// 定位成功回调
const onLocationSuccess = (lnglat) => {
  userLocation.value = lnglat
  // 定位成功后重新加载附近资源（将用户坐标传给后端）
  loadResources() // 如果需要传坐标，请修改 loadResources 增加坐标参数
}

// 组件挂载时加载资源
onMounted(() => {
  loadResources()
})
</script>

<style scoped>
.resource-list {
  padding: 20px;
}
.filter-card {
  margin-bottom: 20px;
}
.map-card {
  margin-bottom: 20px;
  height: 400px;
}
.resource-cards {
  margin-top: 20px;
}
.resource-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}
.resource-card:hover {
  transform: translateY(-5px);
}
.card-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.card-info h3 {
  margin: 10px 0;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>