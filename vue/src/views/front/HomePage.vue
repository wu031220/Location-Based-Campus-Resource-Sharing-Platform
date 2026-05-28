<template>
  <div class="page-container">
    <AMapView
        ref="mapView"
        :center="[108.900081, 34.3698]"
        :zoom="16"
        :markers="data.filteredList"
        @marker-click="handleMapClick"
        :enable-geolocation="allowGeo"
        @location-success="onLocationSuccess"
        @location-failed="onLocationFailed"
        style="width:100%;height:100vh;overflow:hidden; padding-bottom:30px; padding-right:20px;"
    />

    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <el-input
          v-model="filterParams.name"
          placeholder="资源名称"
          style="width: 220px"
      />

      <el-select v-model="filterParams.distance" placeholder="全部范围" style="width: 140px">
        <el-option label="全部范围" :value="0" />
        <el-option label="周边 50 米" :value="50" />
        <el-option label="周边 100 米" :value="100" />
        <el-option label="周边 200 米" :value="200" />
        <el-option label="周边 500 米" :value="500" />
        <el-option label="周边 1000 米" :value="1000" />
      </el-select>

      <el-select v-model="filterParams.typeId" placeholder="全部分类" style="width: 140px">
        <el-option value="">全部分类</el-option>
        <el-option label="教材" :value="1" />
        <el-option label="闲置物品" :value="2" />
        <el-option label="运动器材" :value="3" />
        <el-option label="自习座位" :value="4" />
        <el-option label="共享雨伞" :value="5" />
      </el-select>

      <el-select v-model="filterParams.shareType" placeholder="全部方式" style="width: 140px">
        <el-option value="">全部方式</el-option>
        <el-option label="免费借用" :value="1" />
        <el-option label="付费租赁" :value="2" />
        <el-option label="交换" :value="3" />
      </el-select>

<!--      <el-select v-model="filterParams.status" placeholder="全部状态" style="width: 140px">-->
<!--        <el-option value="">全部状态</el-option>-->
<!--        <el-option label="上架" :value="1" />-->
<!--        <el-option label="已借出" :value="2" />-->
<!--        <el-option label="已下架" :value="3" />-->
<!--      </el-select>-->

      <el-button type="primary" @click="searchResource">搜索</el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <!-- 左侧个性化推荐 -->
    <div class="left-drawer" :class="leftShow ? 'show' : 'hide'">
      <div class="drawer-header">
        <h3>💡 个性化推荐</h3>
      </div>

      <div class="drawer-header" style="padding:10px 14px;border-bottom:1px solid #eee">
        <el-select v-model="filterForm.sortType" @change="handleFilterChange" size="small" style="width:100%">
          <el-option label="距离最近" :value="1" />
          <el-option label="热度最高" :value="2" />
          <el-option label="最新发布" :value="3" />
        </el-select>
      </div>

      <div class="drawer-body" style="padding:10px">
        <div
            class="resource-item"
            v-for="item in data.recommondList"
            :key="item.id"
            @click="openDetail(item)"
        >
          <img
              :src="item.images"
              alt=""
              style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:10px"
          />
          <div class="info">
            <div style="font-weight:500;margin-bottom:4px">{{ item.name }}</div>
            <div style="font-size:12px;color:#999">{{ item.categoryName || '未分类' }}</div>
          </div>
        </div>

        <div v-if="data.recommondList.length === 0" style="text-align:center;padding:40px 0;color:#999">
          暂无推荐资源
        </div>
      </div>
    </div>

    <div class="toggle-btn" @click="leftShow = !leftShow">
      {{ leftShow ? '◀' : '▶' }}
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-mask" v-show="showModal" @click="closeModal">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>{{ currentResource?.name }}</h3>
          <button @click="closeModal">×</button>
        </div>
        <div class="modal-body" v-if="currentResource">
          <div style="width:100%; height:400px;display: flex; align-items: center;">
            <el-carousel style="width:100%;height:400px" trigger="click" arrow="always">
              <el-carousel-item v-for="img in currentResource.imgUrlList || []" :key="img">
                <img
                    :src="img"
                    style="width:100%;height:100%;object-fit:contain;object-position:center"
                />
              </el-carousel-item>
            </el-carousel>
          </div>

          <p><strong>类型：</strong>{{ currentResource.categoryName }}</p>
          <p><strong>位置：</strong>{{ currentResource.locationDesc }}</p>
          <p><strong>介绍：</strong>{{ currentResource.description }}</p>
          <div style="text-align: right; margin-top: 15px;">
            <el-button type="primary" @click="goToDetail(currentResource.id)">
              点击查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, nextTick, onUnmounted, watch } from "vue";
import AMapView from '@/components/AMapView.vue'
import request from "@/utils/request";
import router from "@/router";
import { ElMessage } from 'element-plus'

const mapView = ref(null)
const showModal = ref(false)
const currentResource = ref(null)
const leftShow = ref(true)

// 定位坐标
const userLng = ref(0)
const userLat = ref(0)
const currentZoom = ref(16)
const allowGeo = ref(false)
const mapReady = ref(false)

// 防抖定时器
let loadTimer = null

// 数据列表
const data = reactive({
  resourceList: [],
  filteredList: [],
  recommondList: [],
})

// 筛选参数
const filterForm = reactive({
  sortType: 1
})

const filterParams = reactive({
  name: '',
  userLng: 0,
  userLat: 0,
  typeId: '',
  shareType: '',
  status: 1,
  distance: 0,
  pageNum: 1,
  pageSize: 1000,
  minLng: null,
  maxLng: null,
  minLat: null,
  maxLat: null,
})

// 默认校园坐标
const DEFAULT_LNG = 108.900081
const DEFAULT_LAT = 34.3698

// 根据缩放设置显示数量
const getLimitByZoom = (z) => {
  z = Math.floor(z)
  if (z <= 12) return 1    // 超远视野：很少
  if (z === 13) return 1
  if (z === 14) return 3
  if (z === 15) return 7
  return 10                // 近距离：可以多
}

// 地图移动结束
const onMapMoveEnd = () => {
  if (!mapView.value?.map) return
  const bounds = mapView.value.map.getBounds()
  if (!bounds) return

  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()

  filterParams.minLng = sw.lng
  filterParams.maxLng = ne.lng
  filterParams.minLat = sw.lat
  filterParams.maxLat = ne.lat

  debounceLoad()
}

// 地图缩放结束
const onMapZoomEnd = () => {
  if (!mapView.value?.map) return
  currentZoom.value = mapView.value.map.getZoom()
  filterParams.pageSize = getLimitByZoom(currentZoom.value)
  debounceLoad()
}

// 防抖加载
const debounceLoad = () => {
  clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    loadResourceList()
  }, 300)
}

// 使用默认位置
const useDefaultLocation = () => {
  userLng.value = DEFAULT_LNG
  userLat.value = DEFAULT_LAT
  filterParams.userLng = DEFAULT_LNG
  filterParams.userLat = DEFAULT_LAT

  // 快速加载数据
  loadResourceList()
  loadRecommondList()
}

// 定位成功
const onLocationSuccess = (lnglat) => {
  const [lng, lat] = lnglat
  userLng.value = lng
  userLat.value = lat
  filterParams.userLng = lng
  filterParams.userLat = lat

  if (mapView.value?.map) {
    mapView.value.map.setCenter([lng, lat])
  }

  loadResourceList()
  loadRecommondList()
  ElMessage.success('定位成功')
}

// 定位失败
const onLocationFailed = () => {
  ElMessage.warning('定位失败，使用默认位置')
  useDefaultLocation()
}

// 距离筛选监听
watch(() => filterParams.distance, (val) => {
  if (userLng.value && userLat.value && mapView.value) {
    mapView.value.updateRangeCircle(userLng.value, userLat.value, val)
    loadResourceList()
  }
})

// 🔥 核心：先检查用户定位权限，再决定是否开启地图定位
const checkUserLocationPermission = async () => {
  try {
    const { code, data: user } = await request.get("/user/getCurrentUser")
    if (code !== "200" || !user) {
      allowGeo.value = false
      useDefaultLocation()
      return
    }

    // 用户关闭了位置权限
    if (user.showLocation === 0) {
      allowGeo.value = false
      ElMessage.warning("你未开启位置权限，将使用默认校园位置")
      useDefaultLocation()
      return
    }

    // ✅ 用户已开启权限 → 允许地图定位
    allowGeo.value = true
  } catch (err) {
    console.error(err)
    allowGeo.value = false
    useDefaultLocation()
  }
}

// 加载地图资源
const loadResourceList = () => {
  const limit = getLimitByZoom(currentZoom.value)

  request.get("/shareResource/selectPage", {
    params: {
      ...filterParams,
      pageSize: limit,
      pageNum: 1,
    }
  }).then(res => {
    data.resourceList = res.data?.list || []
    data.filteredList = data.resourceList
  })
}

// 加载推荐列表
const loadRecommondList = () => {
  request.get('/shareResource/recommend', {
    params: {
      userLng: userLng.value,
      userLat: userLat.value,
      sortType: filterForm.sortType,
      pageNum: 1,
      pageSize: 10
    }
  }).then(res => {
    data.recommondList = res.data.list || res.data || []
  }).catch(() => {
    ElMessage.error('获取推荐失败')
  })
}

const handleFilterChange = () => loadRecommondList()
const searchResource = () => loadResourceList()
const resetFilter = () => {
  Object.assign(filterParams, {
    name: '',
    typeId: '',
    shareType: '',
    status: '',
    distance: 0
  })
  loadResourceList()
}

// 弹窗与路由
const openDetail = (item) => {
  currentResource.value = item
  showModal.value = true
  router.push(`/front/resourceDetail?id=${item.id}`)
}
const goToDetail = (id) => router.push(`/front/resourceDetail?id=${id}`)
const closeModal = () => {
  showModal.value = false
  currentResource.value = null
}

// 地图点击
const handleMapClick = (item) => {
  currentResource.value = item
  showModal.value = true
}

// 初始化地图
const initMap = async () => {
  await nextTick()
  if (!mapView.value) return

  mapView.value.initAMap()

  setTimeout(() => {
    const map = mapView.value.map
    if (!map) return

    map.setStatus({
      scrollWheel: true,
      dragEnable: true,
      zoomEnable: true,
    })
    map.on('zoomend', onMapZoomEnd)
    map.on('moveend', onMapMoveEnd)
    mapReady.value = true
  }, 200)
}

// 页面挂载
onMounted(async () => {
  // 锁定滚动
  document.body.style.overflow = 'hidden'
  const elMain = document.querySelector('.el-main')
  if (elMain) elMain.style.cssText = 'overflow:hidden;height:100%'

  // 🔥 优化点1：先检查权限 → 再初始化地图
  await checkUserLocationPermission()

  // 🔥 优化点2：权限检查完再加载地图，时序更合理
  await initMap()
})

onUnmounted(() => {
  document.body.style.overflow = ''
  const elMain = document.querySelector('.el-main')
  if (elMain) elMain.style.cssText = ''
  clearTimeout(loadTimer)
})
</script>

<style scoped>
.page-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden !important;
}

.filter-bar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 10px;
  align-items: center;
}

.left-drawer {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: #fff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 999;
  transition: all 0.3s ease;
  overflow: hidden;
}

.left-drawer.hide { left: -280px; }
.left-drawer.show { left: 0; }

.drawer-header {
  padding: 16px;
  background: #1677ff;
  color: #fff;
}
.drawer-header h3 { margin: 0; font-size: 16px; }

.drawer-body {
  padding: 10px;
  height: calc(100vh - 60px);
  overflow: auto;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  margin-bottom: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
}

.toggle-btn {
  position: fixed;
  top: 50%;
  left: 280px;
  transform: translateY(-50%);
  width: 24px;
  height: 44px;
  background: #1677ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  z-index: 999;
  transition: left 0.3s;
}

.left-drawer.hide + .toggle-btn { left: 0; }

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  background: #fff;
  width: 900px;
  max-width: 92%;
  max-height: 85vh;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  background: #1677ff;
  color: white;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 { margin: 0; font-size: 16px; }
.modal-header button { background: none; border: none; color: white; font-size: 20px; cursor: pointer; }

.modal-body { padding: 16px; }
</style>