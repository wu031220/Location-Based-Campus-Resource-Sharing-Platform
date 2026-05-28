<template>
  <div style="
  width: 79%;
  margin: 20px auto 0;
  background: #fff;
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 0 10px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <el-input
          v-model="data.name"
          placeholder="资源名称"
          style="width: 220px"
      />
      <el-button type="primary" @click="load">搜索</el-button>
    </div>
    <el-button type="primary" @click="openAdd()">发布新资源</el-button>
  </div>

  <el-card class="publish-card">
    <el-table :data="data.resourcelist" fit>
      <el-table-column prop="id" label="ID" width="40"/>
      <el-table-column prop="name" label="资源名称"  min-width="90" class="w-min-100"/>
      <el-table-column prop="description" label="资源描述" min-width="90" show-overflow-tooltip/>
      <el-table-column prop="categoryName" label="资源分类" min-width="88" />
      <el-table-column prop="images" label="资源图片" width="80">
        <template #default="scope">
          <el-image style="width: 50px; height: 50px; object-fit: cover"
                    :src="scope.row.images" :preview-src-list="[scope.row.images]" preview-teleported/>
        </template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '上架' : scope.row.status === 2 ? '审核中' : '下架'}}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="shareTypeName" label="分享方式"  min-width="90" />
      <el-table-column prop="price" label="价格" width="80" />
      <el-table-column prop="availableTime" label="可用时间" width="100" />
      <el-table-column prop="stock" label="可用数量" width="80" />
      <el-table-column prop="viewCount" label="访问数量" width="80" />
      <el-table-column prop="location" label="经纬度" width="110" show-overflow-tooltip/>
      <el-table-column prop="locationDesc" label="位置信息" width="100" show-overflow-tooltip/>
      <el-table-column prop="createTimeStr" label="创建时间" min-width="180" />
      <el-table-column label="操作" width="180px" fixed="right">
        <template #default="scope">
          <el-button @click="openEdit(scope.row)" type="primary">编辑</el-button>
          <el-button @click="del(scope.row.id)" type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
      <el-pagination v-model:current-page="data.pageNum" v-model:page-size="data.pageSize"
                     :total="data.total"
                     layout="total, prev, pager, next"
                     @current-change="load"
      />
    </div>

    <el-dialog v-model="dialogVisible" title="发布资源" width="700px" destroy-on-close>
      <el-form :model="data.form" :rules="data.rules" ref="formRef" label-width="100px" label-position="right">
        <el-form-item prop="name" label="资源名称">
          <el-input v-model="data.form.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="资源描述" prop="description">
          <el-input
              v-model="data.form.description"
              type="textarea"
              rows="3"
              style="width: 400px"
          />
        </el-form-item>
        <el-form-item label="资源分类" prop="typeId" required>
          <el-select
              v-model="data.form.typeId"
              style="width: 400px"
              placeholder="请选择分类"
          >
            <!-- 普通分类正常显示，id=6 的教师分类只给教师看 -->
            <el-option
                v-for="item in data.categoryList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
                v-show="isTeacher || item.id !== 6"
            />
          </el-select>
        </el-form-item>

        <el-form-item prop="images" label="封面图片">
          <el-upload :action="'/api/file/upload'" list-type="picture" :on-success="handleFileUpload" >
            <el-button type="primary">点击上传</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item prop="imgUrlList" label="图片集">
          <el-upload
              :action="'/api/file/upload'"
              list-type="picture-card"
              :on-success="handleImgSuccess"
              :on-remove="handleImgRemove"
              :file-list="fileList"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item prop="status" label="资源状态">
          <el-select v-model="data.form.status" style="width: 400px" placeholder="请选择资源状态">
            <el-option label="上传审核" :value="2" />
            <el-option label="下架" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item prop="shareType" label="分享方式"  min-width="130" >
          <el-select v-model="data.form.shareType" style="width: 400px" placeholder="请选择分享方式">
            <el-option label="免费借用" :value="1" />
            <el-option label="付费租赁" :value="2" />
            <el-option label="交换" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item prop="price" label="价格（元/时）"  min-width="130" v-if="data.form.shareType === 2">
          <el-input-number :min="0" v-model="data.form.price"></el-input-number>
        </el-form-item>
        <el-form-item prop="availableTime" label="可用时间"  min-width="130" v-if="data.form.shareType === 2">
          <el-input v-model="data.form.availableTime" style="width: 400px" placeholder="请输入可用时间" />
        </el-form-item>
        <el-form-item prop="stock" label="可用数量"  min-width="130" >
          <el-input v-model="data.form.stock" style="width: 400px" placeholder="请输入可用数量" />
        </el-form-item>
        <el-form-item prop="location" label="经纬度" min-width="130">
          <el-input
              v-model="data.form.location"
              style="width: 340px; margin-right:10px"
              placeholder="点击按钮从地图选择"
              readonly
          />
          <el-button type="primary" @click="openMapDialog">
            获取位置
          </el-button>
        </el-form-item>
        <el-form-item prop="locationDesc" label="地理位置" min-width="130">
          <el-input
              v-model="data.form.locationDesc"
              style="width: 400px"
              placeholder="自动从地图获取地址"
              readonly
          />
        </el-form-item>

        <el-dialog
            v-model="mapVisible"
            title="选择位置"
            width="70%"
            @open="initMap"
            destroy-on-close
        >
          <AMapView
              ref="mapView"
              :zoom="16"
              :enable-geolocation="true"
              @map-click="handleMapClick"
              @location-success="handleLocationSuccess"
          />
          <div style="text-align:right;margin-top:10px;">
            <el-button @click="mapVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmLocation">确认选择</el-button>
          </div>
        </el-dialog>
      </el-form>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <el-button @click="dialogVisible = false;reset();">取消</el-button>
        <el-button type="primary" @click="save">确认保存</el-button>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import {ref, reactive, onMounted, nextTick} from 'vue'
import { ElMessage } from 'element-plus'
import request from "@/utils/request";
import AMapView from "@/components/AMapView.vue";
import { Plus } from '@element-plus/icons-vue'

const formRef = ref()
const fileList = ref([])
const dialogVisible = ref(false)
const currentUserId = ref(0)
const isTeacher = ref(false)

const data = reactive({
  userId: 0,
  form: {
    userId: 0,
    imgUrlList: [],
  },
  resourcelist: [],
  categoryList: [],
  rules: {
    name: [
      { required: true, message: "请输入资源名称", trigger: "blur" },
      { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
    ],
    typeId: [
      { required: true, message: "请选择资源类型", trigger: "change" }
    ],
    status: [
      { required: true, message: "请选择资源状态", trigger: "change" }
    ],
    shareType: [
      { required: true, message: "请选择分享方式", trigger: "change" }
    ],
    price: [
      { required: true, message: "请输入价格", trigger: "blur" },
      { type: "number", min: 0, message: "价格不能小于0", trigger: "blur" }
    ],
    location: [
      { required: true, message: "请选择位置", trigger: "change" }
    ],
    locationDesc: [
      { required: true, message: "地理位置不能为空", trigger: "change" }
    ]
  },
})

const load = () => {
  request.get('/shareResource/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      name: data.name,
      userId: currentUserId.value,
      typeId: data.typeId,
      status: data.status,
      shareType: data.shareType,
    }
  }).then(res => {
    if (res.code === "200") {
      data.resourcelist = res.data?.list
      data.total = res.data?.total
    } else {
      ElMessage.error(res.message)
    }
  }).catch(() => {
    ElMessage.error("加载失败")
  })
}

const reset = () => {
  data.form = { userId: 0, imgUrlList: [] }
  fileList.value = []
}

const save = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      // 拼接参数
      const params = {
        ...data.form,
        userId: currentUserId.value
      }

      let res
      // ======================
      // 有 ID → 更新
      // 无 ID → 新增
      // ======================
      if (data.form.id) {
        res = await request.put('/shareResource/update', params)
      } else {
        res = await request.post('/shareResource/add', params)
      }

      if (res.code === "200") {
        ElMessage.success("保存成功！")
        dialogVisible.value = false
        load()
      } else {
        ElMessage.error(res.message || "保存失败")
      }
    } catch (err) {
      ElMessage.error("保存失败：" + (err.message || "系统异常"))
    }
  })
}

const del = (id) => {
  request.delete('/shareResource/delete/' + id).then(res => {
    if (res.code === "200") {
      ElMessage.success("删除成功")
      load()
    } else {
      ElMessage.error(res.message)
    }
  }).catch(() => {
    ElMessage.error("删除失败")
  })
}

const openAdd = () => {
  const user = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
  if (user.canPublish === 0) {
    ElMessage.error("你的信用分过低，无法发布资源！")
    return
  }

  Object.assign(data.form, {
    id: null,
    name: '', description: '', typeId: '', images: '',
    shareType: 1, price: 0, availableTime: '', stock: 0,
    location: '', locationDesc: '', status: 2,
    imgUrlList: []
  })
  fileList.value = []
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(data.form, row)
  fileList.value = row.imgUrlList ? row.imgUrlList.map(url => ({ url })) : []
  dialogVisible.value = true
}

const handleFileUpload = (res) => {
  data.form.images = res.data
}

const handleImgSuccess = (response) => {
  if (response.code === "200") {
    data.form.imgUrlList.push(response.data)
  }
}

const handleImgRemove = (file) => {
  data.form.imgUrlList = data.form.imgUrlList.filter(i => i !== file?.response?.data)
}

const loadcategoryList = () => {
  return request.get('/category/selectPage', {
    params: { pageNum: 1, pageSize: 1000 }
  }).then(res => {
    if (res.code === '200') {
      data.categoryList = res.data.list || []
    }
  })
}

const mapVisible = ref(false)
const tempLocation = ref(null)
const mapView = ref(null)

const initMap = () => {
  nextTick(() => {
    if (mapView.value) mapView.value.initAMap()
  })
}

const openMapDialog = () => {
  mapVisible.value = true
}

const handleMapClick = (point) => {
  tempLocation.value = point
  ElMessage.success("已选中当前位置")
}

const handleLocationSuccess = (lnglat) => {
  tempLocation.value = { lng: lnglat[0], lat: lnglat[1] }
}

const confirmLocation = async () => {
  if (!tempLocation.value) {
    ElMessage.warning('请先在地图上点击选择位置')
    return
  }

  const { lng, lat } = tempLocation.value
  data.form.location = `POINT(${lng} ${lat})`
  await getAddressByLngLat(lng, lat)
  mapVisible.value = false
  ElMessage.success('位置已选择')
}

const getAddressByLngLat = async (lng, lat) => {
  try {
    window.AMap.plugin('AMap.Geocoder', function() {
      const geocoder = new window.AMap.Geocoder()
      geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.regeocode) {
          data.form.locationDesc = result.regeocode.formattedAddress
        } else {
          data.form.locationDesc = "陕西省西安市长安大学"
        }
      })
    })
  } catch (err) {
    data.form.locationDesc = "陕西省西安市长安大学"
  }
}

onMounted(() => {
  const user = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
  currentUserId.value = user.id
  isTeacher.value = user.identity === 1
  load()
  loadcategoryList()
})
</script>

<style scoped>
.publish-card {
  max-width: 80%;
  margin: 20px auto;
}
</style>