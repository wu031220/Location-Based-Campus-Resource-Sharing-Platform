<template>
  <div class="page-container">
    <AMapView
        ref="mapView"
        :center="[108.900081,34.3698]"
        :zoom="16"
        :markers="data.filteredList"
        @marker-click="handleMapClick"
        :enable-geolocation="allowGeo"
        @location-success="onLocationSuccess"
        @location-failed="onLocationFailed"
        @map-moveend="onMapMoveEnd"
        @map-zoomend="onMapZoomEnd"
        style="width:100%;height:100vh;overflow:hidden; padding-bottom:30px; padding-right:20px;"
    />

    <!-- 🔥 顶部筛选栏 -->
    <div class="filter-bar">

      <div style="display: flex; align-items: center; gap: 10px;">
        <el-input
            v-model="filterParams.name"
            placeholder="资源名称"
            style="width: 220px"
        />
      </div>

      <div style="display: flex;align-items: center;gap: 8px;white-space: nowrap;">
        <el-select v-model="filterParams.distance" placeholder="全部范围" style="width: 140px">
          <el-option label="全部范围" :value="0" />
          <el-option label="周边 50 米" :value="50" />
          <el-option label="周边 100 米" :value="100" />
          <el-option label="周边 200 米" :value="200" />
          <el-option label="周边 500 米" :value="500" />
          <el-option label="周边 1000 米" :value="1000" />
        </el-select>
      </div>

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

      <el-select v-model="filterParams.status" placeholder="全部状态" style="width: 140px">
        <el-option value="">全部状态</el-option>
        <el-option label="上架" :value="1" />
        <el-option label="已借出" :value="2" />
        <el-option label="已下架" :value="3" />
      </el-select>

      <!-- 按钮统一用 el-button -->
      <el-button type="primary" @click="searchResource">搜索</el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <!-- 左侧个性化推荐 -->
    <div class="left-drawer" :class="leftShow ? 'show' : 'hide'">

      <div class="drawer-header">
        <h3>💡 个性化推荐</h3>
      </div>

      <!-- 排序筛选 -->
      <div class="drawer-header" style="padding:10px 14px;border-bottom:1px solid #eee">
        <el-select v-model="filterForm.sortType" @change="handleFilterChange" size="small" style="width:100%">
          <el-option label="距离最近" :value="1" />
          <el-option label="热度最高" :value="2" />
          <el-option label="最新发布" :value="3" />
        </el-select>
      </div>

      <!-- 推荐列表 -->
      <div class="drawer-body" style="padding:10px">
        <div
            class="resource-item"
            v-for="item in data.recommondList"
            :key="item.id"
            @click="openDetail(item)"
            style="display:flex;align-items:center;margin-bottom:10px;cursor:pointer"
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

        <!-- 空状态 -->
        <div v-if="data.recommondList.length === 0" style="text-align:center;padding:40px 0;color:#999">
          暂无推荐资源
        </div>
      </div>
    </div>

    <!-- 展开/收起箭头按钮 -->
    <div class="toggle-btn" @click="leftShow = !leftShow">
      {{ leftShow ? '◀' : '▶' }}
    </div>

    <div class="modal-mask" v-show="showModal" @click="closeModal">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>{{ currentResource?.name }}</h3>
          <button @click="closeModal">×</button>
        </div>
        <div class="modal-body" v-if="currentResource">

          <!-- 🔥 多图轮播（替换原来的单 img） -->
          <div style="width:100%; height:400px;display: flex; align-items: center;">
            <el-carousel style="width:100%; height:400px;position: relative;" trigger="click" arrow="always">
              <el-carousel-item v-for="img in (currentResource?.imgUrlList || [])" :key="img" style="width:100%; height:400px;">
                <img
                    :src="img"
                    style="width:100%;height:100%;object-fit: contain;object-position: center;"
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
import { reactive,onMounted,ref, nextTick,onUnmounted, watch } from "vue";
import AMapView from '@/components/AMapView.vue'
import request from "@/utils/request";
import router from "@/router";
import { ElMessage } from 'element-plus'

const mapView = ref(null)
const showModal = ref(false)
const currentResource = ref(null)
const leftShow = ref(true)
// 保存用户定位坐标（必须定义！）
const userLng = ref(0);
const userLat = ref(0);
const currentZoom = ref(16)
// 防抖定时器
let loadTimer = null
const allowGeo = ref(false) // 默认：禁止定位
const mapReady = ref(false)// 地图是否已初始化


const data = reactive({
  resourceList: [],
  filteredList: [],
  recommondList: [],
})
// 筛选参数
const filterForm = reactive({

  typeId: 0,        // 0=全部
  sortType: 1       // 1=距离 2=热度 3=最新
})
const filterParams = reactive({
  name: '',
  userLng: 0,
  userLat: 0,
  typeId: null,
  shareType: null,
  status: 1,
  distance: 0,
  pageNum: 1,
  pageSize: 1000,
  minLng: null,
  maxLng: null,
  minLat: null,
  maxLat: null,
});

// 缩放级别对应显示数量
const getLimitByZoom = (z) => {
  z = Math.floor(z)
  console.log('当前缩放级别：', z)
  if (z <= 12) return 1
  if (z === 13) return 2
  if (z === 14) return 4
  return 10
}
// 地图移动结束
const onMapMoveEnd = () => {
  if (!mapView.value || !mapView.value.map) return

  const map = mapView.value.map
  const bounds = map.getBounds()
  if (!bounds) return

  // 高德地图 2.0 正确获取坐标方式！！！
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()

  filterParams.minLng = sw?.lng || 0
  filterParams.maxLng = ne?.lng || 0
  filterParams.minLat = sw?.lat || 0
  filterParams.maxLat = ne?.lat || 0

  debounceLoad()
}

// 地图缩放结束
const onMapZoomEnd = () => {
  if (!mapView.value || !mapView.value.map) return
  const map = mapView.value.map
  currentZoom.value = map.getZoom()
  filterParams.pageSize = getLimitByZoom(currentZoom.value)
  debounceLoad()
}

// 防抖加载 300ms
const debounceLoad = () => {
  clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    loadResourceList()
  }, 300)
}

// 统一默认位置
const useDefaultLocation = () => {
  const defaultLng = 108.800081
  const defaultLat = 34.4698

  userLng.value = defaultLng
  userLat.value = defaultLat
  filterParams.userLng = defaultLng
  filterParams.userLat = defaultLat

  loadResourceList()
  loadRecommondList()
}

const onLocationSuccess = (lnglat) => {
  const lng = lnglat[0]
  const lat = lnglat[1]

  userLng.value = lng
  userLat.value = lat
  filterParams.userLng = lng
  filterParams.userLat = lat

  // ✅ 定位成功 → 自动把地图中心移到用户位置
  if (mapView.value && mapView.value.map) {
    mapView.value.map.setCenter([lng, lat])
  }

  loadResourceList()
  loadRecommondList()
}
const onLocationFailed = () => {
  ElMessage.warning("未开启定位权限，将使用默认校园位置");
  // 赋值为默认校园坐标
  const defaultLng = 108.900081
  const defaultLat = 34.3698
  userLng.value = defaultLng
  userLat.value = defaultLat
  filterParams.userLng = defaultLng
  filterParams.userLat = defaultLat

  // 重新加载数据
  loadResourceList()
  loadRecommondList()
}
watch(() => filterParams.distance, (newVal) => {
  // 必须有定位、有地图、距离 > 0 才画圈
  if (userLng.value && userLat.value && mapView.value) {
    mapView.value.updateRangeCircle(userLng.value, userLat.value, newVal)
    loadResourceList()
  }
})
const checkUserLocationPermission = async () => {
  try {
    const res = await request.get("/user/getCurrentUser")

    if (res.code === "200" && res.data) {
      const user = res.data

      // ==============================
      // 权限关闭：禁用定位、用默认位置
      // ==============================
      if (user.showLocation === 0) {
        allowGeo.value = false
        ElMessage.warning("你未开启位置权限，将使用默认校园位置")
        useDefaultLocation()
        return
      }

      // ==============================
      // ✅ 权限开启：允许定位
      // 地图会通过 enable-geolocation 自动触发定位
      // ==============================
      allowGeo.value = true
      console.log("✅ 已开启定位，地图将自动获取位置")
    }

  } catch (err) {
    allowGeo.value = false
    useDefaultLocation()
  }
}

const loadResourceList = () => {
  // 最多显示数量
  const limit = getLimitByZoom(currentZoom.value)

  // 🔥 只加载【当前视野范围内】的资源
  request.get("/shareResource/selectPage", {
    params: {
      ...filterParams,       // 名称、分类、状态等筛选
      pageSize: limit,       // 最多显示几条
      pageNum: 1,            // 永远只查第一页
      minLng: filterParams.minLng,  // 视野左下角经度
      maxLng: filterParams.maxLng,  // 视野右上角经度
      minLat: filterParams.minLat,  // 视野左下角纬度
      maxLat: filterParams.maxLat   // 视野右上角纬度
    }
  }).then(res => {
    data.resourceList = res.data?.list || []
    data.filteredList = data.resourceList  // 只渲染视野内的点
  })
}

const loadRecommondList = () => {
  request.get('/shareResource/recommend', {
    params: {
      userLng: userLng.value,
      userLat: userLat.value,
      typeId: filterForm.typeId,
      sortType: filterForm.sortType,
      pageNum: 1,
      pageSize: 10
    }
  }).then(res => {
    data.recommondList = res.data.list || res.data
    console.log('✅ 个性化推荐：', data.recommondList)
  }).catch(err => {
    console.error('❌ 推荐接口失败', err)
    ElMessage.error('获取个性化推荐失败')
  })
}
const handleFilterChange = () => {
  loadRecommondList();
}

const searchResource = () => {
  filterParams.pageNum = 1;
  loadResourceList();
};

const resetFilter = () => {
  filterParams.name = '';
  filterParams.typeId = "";
  filterParams.shareType = "";
  filterParams.status = "";
  filterParams.distance = 0;
  loadResourceList();
};

function openDetail(item) {
  currentResource.value = item
  router.push("/front/resourceDetail?id=" + item.id);
  showModal.value = true
}
const goToDetail = (id) => {
  router.push("/front/resourceDetail?id=" + id);
};
// 关闭弹窗
function closeModal() {
  showModal.value = false
  currentResource.value = null
}

// 地图点击事件
function handleMapClick(item) {
  currentResource.value = item
  showModal.value = true
}

onMounted(() => {
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  const elMain = document.querySelector('.el-main');
  if (elMain) {
    elMain.style.overflow = 'hidden';
    elMain.style.height = '100%';
  }

  // 【重点】地图先初始化，不等权限
  nextTick(() => {
    if (mapView.value) {
      mapView.value.initAMap()

      setTimeout(() => {
        const map = mapView.value.map
        if (map) {
          map.setStatus({
            scrollWheel: true,
            dragEnable: true,
            zoomEnable: true,
          })
          map.on('zoomend', onMapZoomEnd)
          map.on('moveend', onMapMoveEnd)

          mapReady.value = true // 地图就绪
        }
      }, 300)
    }
  })

  // 权限检查：并行，不阻塞地图
  checkUserLocationPermission()

  // 推荐列表也并行
  loadRecommondList()
})
onUnmounted(() => {
  // 离开页面解锁
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';

  const elMain = document.querySelector('.el-main');
  if (elMain) {
    elMain.style.overflow = '';
    elMain.style.height = '';
  }

  clearTimeout(loadTimer)
});
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

.filter-bar select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
}

.filter-bar button {
  padding: 6px 12px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filter-bar button:nth-child(5) {
  background: #999;
}

/* 左侧抽屉 */
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

.left-drawer.hide {
  left: -280px;
}

.left-drawer.show {
  left: 0;
}

/* 抽屉头部 */
.drawer-header {
  padding: 16px;
  background: #1677ff;
  color: #fff;
}

.drawer-header h3 {
  margin: 0;
  font-size: 16px;
}

/* 抽屉内容 */
.drawer-body {
  padding: 10px;
  height: calc(100vh - 60px);
  overflow: hidden !important;
}

/* 资源项 */
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

.resource-item img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.resource-item .info {
  flex: 1;
  min-width: 0;
}

.resource-item .info div:first-child {
  font-weight: bold;
  font-size: 14px;
}

.resource-item .info div:last-child {
  font-size: 12px;
  color: #666;
}

/* 展开/收起按钮 */
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

.left-drawer.hide + .toggle-btn {
  left: 0;
}
/* 全屏遮罩 */
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

/* 弹窗盒子 */
.modal-box {
  background: #fff;
  width: 900px;
  max-width: 92%;
  height: 900px;
  max-height: 85vh;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

/* 弹窗头部 */
.modal-header {
  background: #1677ff;
  color: white;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.modal-header button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

/* 弹窗内容 */
.modal-body {
  padding: 16px;
}

.modal-img {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 12px;
}

.modal-body p {
  margin: 0 0 8px 0;
}

.el-carousel__container {
  width: 100%;
  height: 100%;
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}
</style>
