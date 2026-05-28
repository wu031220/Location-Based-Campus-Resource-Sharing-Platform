<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script>
  export default {
    name: 'AMapView',
    props: {
      // 地图中心点，可以是 [经度, 纬度] 或 {lng, lat}
      center: {
        type: [Array, Object],
        default: () => [108.948024, 34.263161] // 长安大学校本部中心坐标
      },
      zoom: {
        type: Number,
        default: 16
      },
      markers: {
        type: Array,
        default: () => [] // 标记点列表，每个对象需包含 lng, lat, title, content 等
      },
      enableGeolocation: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        map: null,
        markerList: [],
        // 新增：选中点位标记
        selectMarker: null,
        circleOverlay: null
      }
    },
    mounted() {
      //this.initMap()
    },
    beforeUnmount() {
      // 销毁地图实例
      if (this.map) {
        this.map.destroy()
      }
    },
    methods: {
      initAMap() {
        this.$nextTick(() => {
          this.initMap()
        })
      },
      initMap() {
        // 确保 AMap 已加载
        if (!window.AMap) {
          console.error('高德地图 API 未加载')
          return
        }
        // 创建地图实例
        const center = Array.isArray(this.center) ? this.center : [this.center.lng, this.center.lat]
        this.map = new window.AMap.Map(this.$refs.mapContainer, {
          zoom: this.zoom,
          center: center,
          viewMode: '2D', // 2D模式
          resizeEnable: true
        })
        // 添加控件
        this.map.addControl(new window.AMap.ToolBar())   // 工具条
        this.map.addControl(new window.AMap.Scale())      // 比例尺
        // 如果需要定位
        if (this.enableGeolocation) {
          this.geolocation()
        }
        // 添加标记点
        this.updateMarkers()
        // 监听地图点击事件等
        this.map.on('click', (e) => {
          const lng = e.lnglat.getLng()
          const lat = e.lnglat.getLat()
          const lnglat = [lng, lat]

          // 清除上一次选中标记
          if (this.selectMarker) {
            this.map.remove(this.selectMarker)
          }

          // 创建选中红点标记
          this.selectMarker = new window.AMap.Marker({
            position: lnglat,
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
            zIndex: 100,
            anchor: 'bottom-center'
          })
          this.map.add(this.selectMarker)

          // 抛出干净坐标给父页面
          this.$emit('map-click', {lng, lat})
        })
      },

      drawRangeCircle(centerLng, centerLat, radius) {
        if (!this.map) return

        // 先清空所有圆
        this.clearRangeCircle()
        // 创建圆形覆盖物
        this.circleOverlay = new window.AMap.Circle({
          center: [centerLng, centerLat],
          radius: radius, // 米
          fillColor: '#1890ff',
          fillOpacity: 0.15,
          strokeColor: '#1890ff',
          strokeOpacity: 0.6,
          strokeWeight: 2
        })
        this.map.add(this.circleOverlay)
        // 地图视野适配圈范围
        this.map.setFitView([this.circleOverlay])
      },
      updateRangeCircle(lng, lat, radius) {
        if(!this.map) return
        if (radius <= 0) {
          this.clearRangeCircle();
          return;
        }
        this.drawRangeCircle(lng, lat, radius)
      },
      clearRangeCircle() {
        if (!this.map) return

        // 🔥 强制删除地图上所有圆，不管你存没存
        let circles = this.map.getAllOverlays('circle')
        if (circles && circles.length) {
          this.map.remove(circles)
        }

        this.circleOverlay = null
      },

      // 获取用户当前位置并移动地图
      geolocation() {
        window.AMap.plugin('AMap.Geolocation', () => {
          const geolocation = new window.AMap.Geolocation({
            enableHighAccuracy: true,
            showCircle: false,
            timeout: 10000,
            showMarker: true,
            // 关键：强制使用高德高精度定位 + 自动坐标纠偏
            useNative: false,
            noIpLocate: 0,
            GeoLocationFirst: true,
          })
          this.map.addControl(geolocation)
          geolocation.getCurrentPosition((status, result) => {
            if (status === 'complete') {
              const lnglat = [result.position.lng, result.position.lat]
              this.map.setCenter(lnglat)
              this.$emit('location-success', lnglat)
            } else {
              console.error('定位失败：', result.message)
              this.$emit('location-error', result.message)
            }
          })
        })
      },
      // 更新标记点（根据 props.markers）
      updateMarkers() {
        if (this.markerList.length) {
          this.map.remove(this.markerList);
          this.markerList = [];
        }

        if (!this.markers.length || !this.map) return;

        // 气泡大小
        const markerWidth = 180;
        const markerHeight = 80;
        const usedBounds = [];

        this.markers.forEach(item => {
          let lng, lat;
          if (item.location && item.location.startsWith("POINT(")) {
            const locStr = item.location.replace("POINT(", "").replace(")", "");
            const arr = locStr.split(" ");
            lng = parseFloat(arr[0]);
            lat = parseFloat(arr[1]);
          } else {
            lng = item.lng;
            lat = item.lat;
          }
          if (!lng || !lat) return;

          const originalPixel = this.map.lngLatToContainer([lng, lat]);
          if (!originalPixel) return;

          let finalPixel = { ...originalPixel };
          let finalLng = lng;
          let finalLat = lat;
          let offsetIndex = 0;
          const step = 12;
          let overlap = false;
          const maxTry = 50; // 最多偏移50次，防止死循环
          let tryCount = 0;

          do {
            overlap = false;
            for (const b of usedBounds) {
              const collide = !(
                  finalPixel.x + markerWidth < b.x ||
                  finalPixel.x > b.x + b.w ||
                  finalPixel.y + markerHeight < b.y ||
                  finalPixel.y > b.y + b.h
              );
              if (collide) {
                overlap = true;
                break;
              }
            }

            if (!overlap) break;

            offsetIndex++;
            tryCount++;
            const angle = offsetIndex * 0.6;
            const dist = step * Math.sqrt(offsetIndex);
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;

            finalPixel.x = originalPixel.x + dx;
            finalPixel.y = originalPixel.y + dy;

            const ll = this.map.containerToLngLat(finalPixel);
            if (ll) {
              finalLng = ll.lng;
              finalLat = ll.lat;
            }

          } while (overlap && tryCount < maxTry);

          usedBounds.push({
            x: finalPixel.x,
            y: finalPixel.y,
            w: markerWidth,
            h: markerHeight
          });

          const markerHtml = `
      <div style="padding:6px 10px;background:#fff;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);width:180px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <img src="${item.images || 'https://picsum.photos/40/40'}"
            style="width:40px;height:40px;object-fit:cover;border-radius:6px;"
            onError="this.src='https://picsum.photos/40/40'">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:bold;font-size:14px;color:#222;">${item.name}</div>
            <div style="font-size:12px;color:#757575;">${item.categoryName}</div>
            <div style="font-size:12px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.description || '暂无描述'}</div>
          </div>
        </div>
      </div>
    `;

          const marker = new window.AMap.Marker({
            position: [finalLng, finalLat],
            content: markerHtml,
            offset: new window.AMap.Pixel(-90, -40),
            zIndex: 100
          });

          marker.on("click", () => {
            this.$emit("marker-click", item);
          });

          this.map.add(marker);
          this.markerList.push(marker);
        });
      },
      initWalkRoute(startLng, startLat, endLng, endLat) {
        // 加载步行插件
        this.map.plugin(["AMap.Walking"], () => {
          const walking = new window.AMap.Walking({
            map: this.map,
            panel: false  // 是否显示文字详情面板
          })
          // 起点、终点
          walking.search(
              [startLng, startLat],
              [endLng, endLat]
          )
        })
      }

    },
    watch: {
      markers: {
        handler() {
          if (this.map) this.updateMarkers()
        },
        deep: true,
        immediate: true
      }
    }
  }
</script>

<style scoped>
  .map-container {
    width: 100%;
    height: 500px;
  }
</style>
