<template>
  <el-card style="width:60%;margin:30px auto">
    <h3 style="text-align:center;margin-bottom:20px">提交借用/租赁订单</h3>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="资源名称" prop="resourceName">
        <el-input v-model="form.resourceName" disabled />
      </el-form-item>

      <el-form-item label="共享类型">
        <el-tag>{{ form.typeName }}</el-tag>
      </el-form-item>

      <el-form-item label="租赁价格" prop="price" v-if="form.shareType === 2">
        <el-input style="width: 100px"
                  v-model.number="form.price"
                  disabled
                  placeholder="自动计算"
        />
        <span style="margin-left:10px; color: #666;">
          单价：{{ resourcePrice }} 元/天
          共 {{ rentDays }} 天
        </span>
      </el-form-item>

      <el-form-item label="借用时间段" prop="timeRange" v-if="form.shareType === 2 || form.shareType === 1">
        <el-date-picker
            v-model="form.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:100%"
            @change="updatePrice"
            :disabled-date="disabledDate"
        />
      </el-form-item>

      <el-form-item label="备注说明" prop="remark">
        <el-input
            v-model="form.remark"
            type="textarea"
            rows="3"
            placeholder="填写借用缘由、联系方式等"
        />
      </el-form-item>

      <el-form-item style="text-align:center;margin-top:30px">
        <el-button type="primary" @click="submitOrder">提交订单</el-button>
        <el-button @click="goBack">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const resourcePrice = ref(0)
// 租赁天数
const rentDays = ref(0)


// 表单
const form = reactive({
  resourceId: '',
  resourceName: '',
  shareType: 1,
  typeName: '',
  price: '',
  timeRange: [],
  remark: ''
})

// ================== 表单校验规则 ==================
const rules = reactive({
  timeRange: [
    { required: true, message: '请选择借用时间段', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入租赁价格', trigger: 'blur' },
    { pattern: /^[1-9]\d*(\.\d{1,2})?$/, message: '请输入合法价格(大于0，最多两位小数)', trigger: 'blur' }
  ],
  remark: [
    { max: 200, message: '备注不能超过200字', trigger: 'blur' }
  ]
})

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e6
}

// 初始化回显资源
onMounted(async () => {
  const rid = route.query.resourceId
  const oid = route.query.ownerId
  if (!rid || !oid) {
    ElMessage.error('参数缺失')
    router.back()
    return
  }
  form.resourceId = rid
  const res = await request.get('/shareResource/selectById', { params: { id: rid } })
  if (res.code === '200') {
    const info = res.data
    form.resourceName = info.name
    form.shareType = info.shareType
    form.typeName = info.shareType === 1 ? '免费借用' : info.shareType === 2 ? '付费租赁' : '交换'
    resourcePrice.value = info.price || 0
  }
})

const updatePrice = () => {
  if (form.shareType !== 2) return // 不是租赁不计算
  if (!form.timeRange || form.timeRange.length < 2) return

  const [start, end] = form.timeRange
  const startTime = new Date(start)
  const endTime = new Date(end)

  // 计算天数
  const days = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1
  rentDays.value = days

  // 计算总价：单价 × 天数
  const total = (resourcePrice.value * days).toFixed(2)
  form.price = total
}

// 提交订单
const submitOrder = async () => {
  await formRef.value.validate(async valid => {
    if (!valid) return

    const [startDate, endDate] = form.timeRange
    if (startDate > endDate) {
      ElMessage.error('开始时间不能大于结束时间')
      return
    }

    // 🔥 标准格式化：yyyy-MM-dd 00:00:00
    const startTime = startDate + ' 00:00:00'
    const endTime = endDate + ' 23:59:59'

    // 获取当前登录用户
    const userRes = await request.get('/user/getCurrentUser')
    if (userRes.code !== '200') {
      ElMessage.error('请先登录')
      return
    }
    const userId = userRes.data.id

    const params = {
      resourceId: form.resourceId,
      resourceName: form.resourceName,
      ownerId: route.query.ownerId,
      borrowerId: userId,
      type: form.shareType,
      price: form.shareType === 2 ? form.price : 0,

      remark: form.remark,
      status: 0
    }
    if (form.shareType !== 3) {
      params.startTime = startTime
      params.endTime = endTime
    }
    const res = await request.post('/transaction/add', params)
    if (res.code === '200') {
      ElMessage.success('订单提交成功，等待物主审批')
      router.push({
        path: '/front/resourceDetail',
        query: { id: form.resourceId }
      })
    } else {
      ElMessage.error(res.message)
    }
  })
}

const goBack = () => {
  router.back()
}
</script>

<style scoped></style>