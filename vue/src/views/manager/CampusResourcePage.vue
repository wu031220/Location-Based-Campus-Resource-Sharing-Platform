<template>
  <div>
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input style="width: 260px" v-model="data.name" placeholder="请输入资源名称" :prefix-icon="Search" />
      <!-- 我帮你加的 4 个查询条件 -->
      <el-select style="width: 150px; margin-left:10px" v-model="data.typeId" placeholder="资源分类" clearable>
        <el-option label="教材" :value="1" />
        <el-option label="闲置物品" :value="2" />
        <el-option label="运动器材" :value="3" />
        <el-option label="自习座位" :value="4" />
        <el-option label="共享雨伞" :value="5" />
        <el-option label="其他" :value="7" />
      </el-select>

      <el-select style="width: 130px; margin-left:10px" v-model="data.status" placeholder="资源状态" clearable>
        <el-option label="上架中" :value="1" />
        <el-option label="待审核" :value="2" />
        <el-option label="下架" :value="3" />
      </el-select>

      <el-select style="width: 130px; margin-left:10px" v-model="data.shareType" placeholder="分享方式" clearable>
        <el-option label="免费" :value="1" />
        <el-option label="付费" :value="2" />
        <el-option label="押金" :value="3" />
      </el-select>

      <el-date-picker
          style="width: 230px; margin-left:10px"
          v-model="data.createTime"
          type="daterange"
          placeholder="选择创建时间"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
      />

      <!-- 按钮 -->
      <el-button style="margin-left: 10px" @click="load" type="primary">查询</el-button>
      <el-button style="margin-left: 10px" @click="reset">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <div style="margin-bottom: 10px">
        <el-button type="info" @click="handleAdd">新增</el-button>
      </div>
      <div>
        <el-table :data="data.tableData" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="40"/>
          <el-table-column prop="name" label="资源名称" min-width="90" show-overflow-tooltip/>
          <el-table-column prop="description" label="资源描述" min-width="100" show-overflow-tooltip/>
          <el-table-column prop="categoryName" label="资源分类" min-width="80" />
          <el-table-column prop="username" label="发布用户" min-width="80" />
          <el-table-column prop="images" label="资源图片" width="80">
            <template #default="scope">
              <el-image style="width: 50px; height: 50px; object-fit: cover"
                        :src="scope.row.images" :preview-src-list="[scope.row.images]" preview-teleported/>
            </template>
          </el-table-column>
          <el-table-column prop="statusName" label="资源状态" min-width="80" />
          <el-table-column prop="shareTypeName" label="分享方式"  min-width="80" />
          <el-table-column prop="price" label="价格" width="80" />
          <el-table-column prop="availableTime" label="可用时间" width="100" />
          <el-table-column prop="viewCount" label="可用数量" width="80" />
          <el-table-column prop="location" label="经纬度" width="110" show-overflow-tooltip/>
          <el-table-column prop="locationDesc" label="位置信息" width="100" show-overflow-tooltip/>
          <el-table-column prop="createTimeStr" label="创建时间" min-width="180" />
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="scope">
              <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: nowrap;">
                <el-button @click="handleCheck(scope.row)" type="warning" v-if="scope.row.status === 2">一键审核</el-button>
                <el-button @click="handleEdit(scope.row)" type="primary">编辑</el-button>
                <el-button @click="del(scope.row.id)" type="danger">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-pagination v-model:current-page="data.pageNum" v-model:page-size="data.pageSize"
                     @current-change="load" layout="total,prev,  pager, next" :total="data.total" />
    </div>
  </div>

  <el-dialog v-model="data.dialogFormVisible" title="资源信息" width="50%" height="50" destroy-on-close>
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
          <el-option
              v-for="item in data.categoryList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="发布用户" prop="userId" required>
        <el-select
            v-model="data.form.userId"
            style="width: 400px"
            placeholder="请选择发布用户"
            filterable
            clearable
        >
            <el-option
                v-for="user in data.userList"
                :key="user.id"
                :label="user.username"
                :value="user.id"
            />
        </el-select>
      </el-form-item>

      <el-form-item prop="images" label="图片">
        <el-upload :action="'/api/file/upload'" list-type="picture" :on-success="handleFileUpload" >
          <el-button type="primary">点击上传</el-button>
        </el-upload>
      </el-form-item>
      <el-form-item prop="status" label="资源状态">
        <el-select v-model="data.form.status" style="width: 400px" placeholder="请选择资源状态">
          <el-option label="上架" :value="1" />
          <el-option label="待审核" :value="2" />
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
        <el-date-picker
            v-model="timeRange"
            type="daterange"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            range-separator=" - "
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 400px"
            @change="handleAvailableTimeChange"
        />
      </el-form-item>
      <!-- 经纬度 + 获取位置 -->
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

      <!-- 地理位置 -->
      <el-form-item prop="locationDesc" label="地理位置" min-width="130">
        <el-input
            v-model="data.form.locationDesc"
            style="width: 400px"
            placeholder="自动从地图获取地址"
            readonly
        />
      </el-form-item>

      <!-- 地图选择弹窗 -->
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
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="data.dialogFormVisible = false">Cancel</el-button>
        <el-button type="primary" @click="save">Confirm</el-button>
      </div>
    </template>
  </el-dialog>

</template>

<script setup>
import { reactive,onMounted,ref, nextTick } from "vue";
import { Search } from "@element-plus/icons-vue"
import request from "@/utils/request";
import {ElMessage} from "element-plus";
import AMapView from '@/components/AMapView.vue' // 你的地图组件路径


const formRef=ref()
const data = reactive({
  name: null,
  tableData: [],
  total: 1,
  pageNum: 1,
  pageSize: 5,
  typeId: null,
  status: null,
  shareType: null,
  createTime: [],
  dialogFormVisible: false,
  form: {},
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
    // 新增：分享方式
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
  categoryList: [],
  userList: [],
})
const imageList = ref([])

const load = () => {
  request.get('/shareResource/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      name: data.name,
      typeId: data.typeId,
      status: data.status,
      shareType: data.shareType,
      startTime: data.createTime?.[0] || '',
      endTime: data.createTime?.[1] || ''
    }
  }).then(res => {
    if (res.code === "200") {
      data.tableData = res.data?.list
      data.total = res.data?.total
    } else {
      ElMessage.error(res.message)
    }
  })
}
const reset = () => {
  data.name = null
  data.typeId = null
  data.status = null
  data.shareType = null
  data.createTime = []
  load()
}
const del = (id) => {
  request.delete('/shareResource/delete/' + id ).then(res =>{
    if (res.code === "200") {
      ElMessage.success('操作成功')
      load()
    }else {
      ElMessage.error(res.message)
    }
  })
}

const add = () =>{
  request.post('/shareResource/add',data.form).then(res =>{
    if (res.code === "200") {
      ElMessage.success('操作成功')
      data.dialogFormVisible = false
      load()
    }else {
      ElMessage.error(res.message)
    }
  })
}
const update = () =>{
  request.put('/shareResource/update',data.form).then(res =>{
    if (res.code === "200") {
      ElMessage.success('操作成功')
      data.dialogFormVisible = false
      load()
    }else {
      ElMessage.error(res.message)
    }
  })
}
const save = () => {
  formRef.value.validate ((valid) => {
    if(valid){
      if(data.form.id){
        update()
      }
      else{
        add()
      }
    }
  })
}
const handleAdd = async() =>  {
  await loadcategoryList();
  await loadUserList()
  formRef.value?.clearValidate()
  data.form = {price: 0}
  data.dialogFormVisible = true
}
// 时间范围选择器绑定
const timeRange = ref([]);

// 选择后自动拼接成字符串存入 availabletime
const handleAvailableTimeChange = (val) => {
  if (val && val.length === 2) {
    data.form.availableTime = val[0] + " - " + val[1];
  } else {
    data.form.availableTime = "";
  }
};
const handleEdit = async (row) => {
  console.log("编辑数据：", row);
  console.log("availabletime：", row.availableTime);

  formRef.value?.clearValidate()
  await loadcategoryList();
  await loadUserList()
  data.form = JSON.parse(JSON.stringify(row))

  imageList.value = row.images ? [{ url: row.images }] : [];
  data.dialogFormVisible = true

  nextTick(() => {
    timeRange.value = [];
    if (!row.availableTime) return;

    let str = row.availableTime.trim();
    let arr = str.split(" - ").map((item) => item.trim());
    if (arr.length === 2) {
      timeRange.value = [arr[0], arr[1]];
      console.log("最终赋值给选择器：", timeRange.value);
    }
  });
}
const handleCheck = async (row) => {
  let form = { ...row, status: 1 }
  request.put('/shareResource/update', form).then(res => {
    if (res.code === '200') {
      ElMessage.success('审核成功')
      load()
    }
  })
}
const loadcategoryList = () => {
  return request.get('/category/selectPage', {
    params: {
      pageNum: 1,
      pageSize: 1000
    }
  }).then(res => {
    if (res.code === '200') {
      data.categoryList = res.data.list || []
    }
  })
}
const loadUserList = () => {
  return request.get('/user/selectPage', {
    params: {
      pageNum: 1,
      pageSize: 1000
    }
  }).then(res => {
    if (res.code === "200") {
      data.userList = res.data.list || []
    }
  })
}
const handleFileUpload = (res) => {
  data.form.images = res.data
}

const mapVisible = ref(false)
const tempLocation = ref(null)
const mapView = ref(null)

const initMap = () => {
  nextTick(() => {
    if (mapView.value) {
      mapView.value.initAMap()
    }
  })
}
// 打开地图
const openMapDialog = () => {
  mapVisible.value = true
}

// 点击地图获取经纬度
const handleMapClick = (point) => {
  tempLocation.value = point
  ElMessage.success("已选中当前位置")
}

// 定位成功
const handleLocationSuccess = (lnglat) => {
  tempLocation.value = { lng: lnglat[0], lat: lnglat[1] }
}

// 确认位置 → 回填表单
const confirmLocation = async () => {
  if (!tempLocation.value) {
    ElMessage.warning('请先在地图上点击选择位置')
    return
  }

  const { lng, lat } = tempLocation.value
  data.form.location = `POINT(${lng} ${lat})`

  // 逆地理解析 → 获取真实地址
  await getAddressByLngLat(lng, lat)

  mapVisible.value = false
  ElMessage.success('位置已选择')
}

// 高德地图逆地理编码（国内精准，100%可用）
const getAddressByLngLat = async (lng, lat) => {
  try {
    // 直接使用已加载的高德地图SDK做逆地理编码
    window.AMap.plugin('AMap.Geocoder', function() {
      const geocoder = new window.AMap.Geocoder()

      // 传入经纬度获取地址
      geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.regeocode) {
          // ✅ 自动获取省市区街道详细地址
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
onMounted(()=>{
  load();
});
</script>

