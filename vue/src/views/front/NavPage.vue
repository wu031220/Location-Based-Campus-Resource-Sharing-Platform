<template>
  <div style="max-width: 1000px; margin: 20px auto; padding: 0 15px;">
    <el-card>
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px;">
        🚶 步行导航
      </div>

      <AMapView
          ref="mapRef"
          :center="destCenter"
          :zoom="16"
          :enable-geolocation="true"
          :markers="resourceMarker"
          @location-success="handleLocationSuccess"
      />

      <div style="margin: 15px 0; display: flex; gap: 12px;">
        <el-button type="primary" @click="getCurrentPos">获取我的位置</el-button>
        <el-button type="success" @click="buildWalkRoute">生成步行路线</el-button>
        <el-button @click="$router.go(-1)">返回</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import AMapView from '@/components/AMapView.vue'
import request from '@/utils/request'

export default {
  name: 'NavPage',
  components: { AMapView },
  data() {
    return {
      resourceId: '',
      resource: {},
      destCenter: [108.948, 34.263],
      resourceMarker: [],
      myPos: null
    }
  },
  mounted() {
    this.resourceId = this.$route.query.resourceId
    this.loadResource()

    setTimeout(() => {
      if (this.$refs.mapRef) {
        this.$refs.mapRef.initAMap()
      }
    }, 300)
  },
  methods: {
    async loadResource() {
      try {
        const res = await request.get('/shareResource/selectById/' + this.resourceId)
        const data = res.data

        const lng = Number(data.longitude)
        const lat = Number(data.latitude)
        this.destCenter = [lng, lat]

        this.resourceMarker = [
          {
            lng: lng,
            lat: lat,
            name: data.name,
            categoryName: '资源',
            description: data.locationDesc,
            images: data.imgUrlList?.[0] || 'https://picsum.photos/40/40'
          }
        ]
      } catch (e) {
        console.error('加载失败', e)
      }
    },
    getCurrentPos() {
      this.$refs.mapRef.geolocation()
    },
    handleLocationSuccess(pos) {
      this.myPos = pos
    },
    buildWalkRoute() {
      if (!this.myPos) return
      this.$refs.mapRef.initWalkRoute(
          this.myPos[0], this.myPos[1],
          this.destCenter[0], this.destCenter[1]
      )
    }
  }
}
</script>