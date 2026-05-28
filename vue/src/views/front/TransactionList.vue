<template>
  <el-card style="width: 80%; margin: 20px auto;position: relative">
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
      <!-- 1. 主切换：我借用的 / 我收到的申请 -->
      <el-radio-group v-model="type" @change="data.status='',loadTransactions()">
        <el-radio-button label="borrower">我借用的</el-radio-button>
        <el-radio-button label="owner">我收到的申请</el-radio-button>
      </el-radio-group>

      <!-- 2. 借用者状态（borrower 专用） -->
      <el-radio-group
          v-if="type === 'borrower'"
          v-model="data.status"
          @change="loadTransactions"
      >
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="0">待同意</el-radio-button>
        <el-radio-button label="1">待交接</el-radio-button>
        <el-radio-button label="5">待支付</el-radio-button>
        <el-radio-button label="3,9">使用中</el-radio-button>
        <el-radio-button label="4,10">已完成</el-radio-button>
      </el-radio-group>

      <!-- 3. 物主状态（owner 专用） -->
      <el-radio-group
          v-if="type === 'owner'"
          v-model="data.status"
          @change="loadTransactions"
      >
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="0">待审批</el-radio-button>
        <el-radio-button label="6">待发货</el-radio-button>
        <el-radio-button label="3,9">使用中</el-radio-button>
        <el-radio-button label="4,10">已完成</el-radio-button>
      </el-radio-group>
    </div>

<!--    <el-button style="position: absolute;right: 20px" type="warning" @click="router.push('/front/history')">-->
<!--      查看全部历史记录-->
<!--    </el-button>-->

    <div>
      <el-table :data="data.transactionData" style="margin-top: 20px;">
        <el-table-column prop="id" label="订单号" min-width="60"/>
        <el-table-column prop="resourceName" label="资源" />
        <el-table-column label="资源图" width="80">
          <template #default="{ row }">
            <div v-if="row">
              <el-image
                  v-if="row.resourceId"
                  :src="getImageUrl(row.resourceId)"
                  fit="cover"
                  style="width:50px;height:50px;border-radius:4px"
              />
              <span v-else style="color:#ccc">无图</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="typeName" label="交易类型" />
        <el-table-column prop="amount" label="金额" />

        <el-table-column prop="borrowerName" label="借用人" v-if="type === 'owner'" />
        <el-table-column prop="ownerName" label="所有者" v-else />
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="endTime" label="结束时间" />

        <el-table-column label="状态">
          <template #default="{ row }">
            <div v-if="row">
              <el-tag v-if="row.type === 1" :type="FreeStatusMap[row.status]?.type">
                {{ FreeStatusMap[row.status]?.text }}
              </el-tag>
              <el-tag v-if="row.type === 2" :type="PayStatusMap[row.status]?.type">
                {{ PayStatusMap[row.status]?.text }}
              </el-tag>
              <el-tag v-if="row.type === 3" :type="FreeStatusMap[row.status]?.type">
                {{ FreeStatusMap[row.status]?.text }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="150px">
          <template #default="{ row }">
            <div v-if="row">
              <el-button v-if="row.status === 0 && type === 'owner'" size="small" @click="handle(row, 'agree')">同意</el-button>
              <el-button v-if="row.status === 0 && type === 'owner'&& row.shareType === 2" size="small" @click="updatePrice(row)">调整价格</el-button>
              <el-button v-if="row.status === 0 && type === 'owner'" size="small" type="danger" @click="handle(row, 'reject')">拒绝</el-button>
              <el-button v-if="row.type === 1 && row.status === 1 && type === 'borrower'" size="small" @click="handle(row, 'confirm')">确认交接</el-button>
              <el-button v-if="row.type === 3 && row.status === 1 && type === 'borrower'" size="small" @click="handle(row, 'confirm')">确认交接</el-button>
              <el-button v-if="row.type === 1 && row.status === 11 && type === 'borrower'" size="small" @click="handle(row, 'confirm')">确认归还</el-button>
              <el-button v-if="row.type === 2 && row.status === 5 && type === 'borrower'" size="small" type="primary" @click="toPay(row)">去支付</el-button>
              <el-button v-if="row.type === 2 && row.status === 6 && type === 'owner'" size="small" @click="handle(row, 'confirm')">确认发货</el-button>
              <el-button v-if="row.type === 2 && row.status === 6 && type === 'owner'" size="small" type="info" @click="handle(row, 'refund')">退款</el-button>
              <el-button v-if="row.status === 9 && type === 'borrower'" size="small" @click="handle(row, 'confirm')">确认收货</el-button>
              <el-button v-if="row.status === 3 && type === 'owner'" size="small" @click="handle(row, 'return')">提前归还</el-button>
              <el-button v-if="row.status === 11 && type === 'owner'" size="small" @click="handle(row, 'return')">完成</el-button>
              <!-- 已完成订单 显示评价按钮 -->
              <el-button
                  v-if="(row.status === 4 || row.status === 10)"
                  @click="goEvaluate(row)"
              >
                去评价
              </el-button>
              <el-button
                  v-if="(row.status === 4 || row.status === 10)"
                  @click="goAppeal(row)"
              >
                申诉
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
        <el-pagination v-model:current-page="data.pageNum" v-model:page-size="data.pageSize"
                       :total="data.total"
                       layout="total, prev, pager, next"
                       @current-change="loadTransactions"
        />
      </div>
    </div>
  </el-card>

  <el-dialog
      v-model="showPriceDialog"
      title="调整租赁价格"
      width="500px"
      @closed="clearPriceForm"
  >
    <el-form label-width="80px" :model="priceForm">
      <el-form-item label="当前价格">
        <span style="color: #f56c6c; font-weight: bold">{{ currentOrder.amount}} 元</span>
      </el-form-item>
      <el-form-item label="新价格" prop="newPrice">
        <el-input
            v-model.number="priceForm.newPrice"
            type="number"
            placeholder="请输入新的租赁价格"
            min="0.01"
            step="0.01"
            style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="备注说明">
        <el-input
            v-model="priceForm.remark"
            type="textarea"
            rows="2"
            placeholder="可选：填写价格调整原因"
            maxlength="50"
            show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showPriceDialog = false">取消</el-button>
      <el-button type="primary" @click="submitNewPrice" :loading="priceLoading">
        确认修改
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
      v-model="showEvaluateDialog"
      title="订单评价"
      width="500px"
      :close-on-click-modal="false"
  >
    <div style="display: flex; align-items: center; margin: 20px 0;">
      <span style="width: 80px; text-align: right; margin-right: 15px;">综合评分：</span>
      <el-rate
          v-model="evaluateScore"
          :max="5"
          allow-half
          show-score
      />
    </div>

    <el-form label-width="80px">
      <el-form-item label="评价内容:">
        <el-input
            v-model="evaluateContent"
            type="textarea"
            rows="4"
            placeholder="请输入评价内容..."
            maxlength="200"
            show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showEvaluateDialog = false">取消</el-button>
      <el-button type="primary" @click="submitEvaluate" :loading="submitting">
        提交评价
      </el-button>
    </template>
  </el-dialog>

  <!-- 申诉弹窗 -->
  <el-dialog
      v-model="appealDialogVisible"
      title="订单申诉"
      width="520px"
      :close-on-click-modal="false"
  >
    <el-form :model="appealForm" ref="appealFormRef" label-width="100px" label-position="right">

      <!-- 申诉理由 -->
      <el-form-item label="申诉理由" prop="appealReason" required>
        <el-input
            v-model="appealForm.appealReason"
            type="textarea"
            rows="4"
            style="width:400px"
            placeholder="请输入申诉理由"
        />
      </el-form-item>

      <!-- 证据图片上传（和你资源上传一模一样！） -->
      <el-form-item label="证据图片">
        <el-upload
            :action="'/api/file/upload'"
            list-type="picture-card"
            :on-success="handleEvidenceSuccess"
            :on-remove="handleEvidenceRemove"
            :file-list="evidenceFileList"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>

    </el-form>

    <template #footer>
      <el-button @click="appealDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitAppeal" :loading="appealLoading">提交申诉</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from "@/utils/request";
import router from "@/router";
import { ElMessage } from "element-plus";



const type = ref('borrower')
const userInfo = ref({})
const showPriceDialog = ref(false)
const priceLoading = ref(false)

const appealDialogVisible = ref(false)
const appealLoading = ref(false)
const appealForm = reactive({
  orderId: '',
  evaContent: '',
  appealReason: '',
  evidencePicList: []
})

const data = reactive({
  pageNum: 1,
  pageSize: 10,
  resourceName: '',
  borrowerId: null,
  ownerId: null,
  orderType: '',
  status: '', // 🔥 状态筛选绑定
  createTime: [],
  transactionData: [],
  resourceList: [],
  total: 0
})

// 免费流程
const FreeStatusMap = {
  0: { text: '待同意', type: 'warning' },
  1: { text: '已同意', type: 'primary' },
  2: { text: '已拒绝', type: 'danger' },
  3: { text: '使用中', type: 'success' },
  4: { text: '已归还', type: 'info' },
  11: { text: '待归还', type: 'primary' },
  10: { text: '已完成', type: 'info' },
}

// 付费流程
const PayStatusMap = {
  0: { text: '待同意', type: 'warning' },
  5: { text: '待支付', type: 'warning' },
  6: { text: '已支付', type: 'primary' },
  7: { text: '退款中', type: '' },
  8: { text: '已退款', type: '' },
  9: { text: '使用中', type: 'success' },
  10: { text: '已完成', type: 'info' },
}

// 获取用户信息
const fetchUserInfo = async () => {
  const token = sessionStorage.getItem('token')
  if (!token) {
    router.push('/')
    return
  }

  try {
    const res = await request.get('/user/getCurrentUser')
    if (res.code === "200") {
      userInfo.value = res.data
      sessionStorage.setItem('userInfo', JSON.stringify(res.data))
      loadTransactions()
    } else {
      sessionStorage.clear()
      router.push('/')
    }
  } catch (err) {
    sessionStorage.clear()
    router.push('/')
  }
}

// 加载订单
function loadTransactions() {
  if (!userInfo.value.id) return

  if (type.value === "owner") {
    data.borrowerId = null
    data.ownerId = userInfo.value.id
  } else {
    data.ownerId = null
    data.borrowerId = userInfo.value.id
  }

  request.get("/transaction/selectPage", {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      resourceName: data.resourceName,
      borrowerId: data.borrowerId,
      ownerId: data.ownerId,
      type: data.orderType,
      status: data.status, // 🔥 传给后端筛选
      startTime: data.createTime?.[0] || "",
      endTime: data.createTime?.[1] || "",
    },
  }).then((res) => {
    if (res.code === "200") {
      data.transactionData = res.data.list || []
      data.total = res.data.total
      loadResourceList()
    }
  })
}

// 操作
const handle = async (row, action) => {
  try {
    let url = ''
    let msg = ''

    if (action === 'agree') {
      url = '/transaction/agree'
      msg = '同意成功'
    } else if (action === 'reject') {
      url = '/transaction/reject'
      msg = '已拒绝'
    } else if (action === 'confirm') {
      url = '/transaction/confirm'
      msg = '已确认'
    } else if (action === 'return') {
      url = '/transaction/return'
      msg = '已完成'
    } else if (action === 'refund') {
      url = '/transaction/refund'
      msg = '退款成功'
    }

    const res = await request.post(url, null, { params: { id: row.id } })
    if (res.code === "200") {
      ElMessage.success(msg)
      loadTransactions()
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e) {
    ElMessage.error('操作异常')
  }
}

const priceForm = reactive({
  newPrice: null,
  remark: ''
})

const updatePrice = (row) => {
  currentOrder.value = row
  priceForm.newPrice = row.amount // 默认填充当前价格
  priceForm.remark = ''
  showPriceDialog.value = true
}
const submitNewPrice = async () => {
  if (!priceForm.newPrice || priceForm.newPrice <= 0) {
    ElMessage.warning('请输入有效的价格')
    return
  }

  priceLoading.value = true
  try {
    // 调用后端修改价格接口
    const res = await request.post('/transaction/updatePrice', null, {
      params: {
        id: currentOrder.value.id,
        newPrice: priceForm.newPrice
      }
    })

    if (res.code === "200") {
      ElMessage.success('价格调整成功！请通知用户支付')
      showPriceDialog.value = false
      loadTransactions() // 刷新列表
    } else {
      ElMessage.error(res.message || '调整失败')
    }
  } catch (e) {
    ElMessage.error('调整价格异常')
  } finally {
    priceLoading.value = false
  }
}

// 去支付
const toPay = (row) => {
  router.push({
    path: '/front/transaction/pay',
    query: { id: row.id, price: row.amount }
  })
}

// 加载资源图片
const loadResourceList = async () => {
  if (!data.transactionData || data.transactionData.length === 0) {
    data.resourceList = []
    return
  }

  const resourceIds = [...new Set(data.transactionData.map(item => item.resourceId).filter(Boolean))]
  const list = []
  for (const id of resourceIds) {
    try {
      const res = await request.get("/shareResource/selectById", { params: { id } })
      if (res.code === "200" && res.data) list.push(res.data)
    } catch (e) {1}
  }
  data.resourceList = list
}

const getImageUrl = (resourceId) => {
  const resource = data.resourceList.find(item => item.id === resourceId)
  return resource?.images || ''
}

const showEvaluateDialog = ref(false)
const evaluateScore = ref(0)
const evaluateContent = ref('')
const submitting = ref(false)

const currentOrder = ref(null)
const toUserId = ref(null)
const hasEvaluated = ref(false) // 是否已经评价

// 打开评价
const goEvaluate = async (row) => {
  currentOrder.value = row

  // 自动识别对方（被评价人）
  if (row.ownerId === userInfo.value.id) {
    toUserId.value = row.borrowerId
  } else {
    toUserId.value = row.ownerId
  }

  try {
    // 检查是否已经评价
    const res = await request.get('/comment/check', {
      params: {
        transactionId: row.id,
        fromUserId: userInfo.value.id
      }
    })

    hasEvaluated.value = res.data

    if (hasEvaluated.value) {
      // 加载已有评价
      const detail = await request.get('/comment/getByOrderAndUser', {
        params: {
          transactionId: row.id,
          fromUserId: userInfo.value.id
        }
      })
      evaluateScore.value = detail.data.score
      evaluateContent.value = detail.data.content
      ElMessage.info('已评价，可修改')
    } else {
      evaluateScore.value = 0
      evaluateContent.value = ''
    }
  } catch (e) {
    ElMessage.warning('获取评价状态失败')
  }

  showEvaluateDialog.value = true
}

// 提交（自动新增 / 更新）
const submitEvaluate = async () => {
  if (!evaluateScore.value) {
    ElMessage.warning('请选择评分')
    return
  }

  const params = {
    transactionId: currentOrder.value.id,
    fromUserId: userInfo.value.id,
    toUserId: toUserId.value,
    score: evaluateScore.value,
    content: evaluateContent.value
  }

  submitting.value = true
  try {
    if (hasEvaluated.value) {
      // 更新
      const res = await request.post('/comment/update', params)
      if (res.code === "200") ElMessage.success('修改成功')
    } else {
      // 新增
      const res = await request.post('/comment/add', params)
      if (res.code === "200") ElMessage.success('评价成功')
    }
    showEvaluateDialog.value = false
    loadTransactions()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const goAppeal = (row) => {
  request.get("/appeal/checkExist", {
    params: {
      orderId: row.id
    }
  }).then(res => {
    // res.data === 1 → 已申诉
    if (res.data) {
      ElMessage.warning("该订单已提交过申诉！");
    } else {
      // 未申诉 → 打开弹窗
      appealForm.orderId = row.id;
      appealForm.evaContent = row.content;
      appealForm.appealReason = '';
      appealDialogVisible.value = true;
    }
  });
};
const handleEvidenceSuccess = (response) => {
  if (response.code === "200") {
    appealForm.evidencePicList.push(response.data)
  }
}
const handleEvidenceRemove = (file) => {
  appealForm.evidencePicList = appealForm.evidencePicList.filter(
      i => i !== file?.response?.data
  )
}
// 提交申诉
const submitAppeal = async () => {
  if(!appealForm.appealReason){
    return ElMessage.warning('请填写申诉理由')
  }
  const res = await request.post('/appeal/submit', appealForm)
  if(res.code === "200"){
    ElMessage.success('申诉提交成功，等待管理员审核')
    appealDialogVisible.value = false
  }else{
    ElMessage.error(res.msg || '提交失败')
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>