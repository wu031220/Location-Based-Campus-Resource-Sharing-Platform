<template>
  <div class="profile-page">
    <!-- 左侧 -->
    <div class="left-card">
      <el-card>
        <div class="user-info">
          <!-- 头像 + 上传 -->
          <el-upload
              :action="'/api/file/upload'"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              style="margin: 0 auto;display: block"
          >
            <el-avatar :size="100" :src="userInfo.avatar" />
          </el-upload>

          <h2 class="name">{{ userInfo.realName }}</h2>
          <p class="text-gray">学号：{{ userInfo.studentId }}</p>
          <p class="text-tip">点击头像即可上传</p>
        </div>
        <el-divider />

        <el-menu
            default-active="1"
            class="left-menu"
            @select="handleMenuSelect"
        >
          <el-menu-item index="1">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>
          <el-menu-item index="2">
            <el-icon><Lock /></el-icon>
            <span>隐私设置</span>
          </el-menu-item>
          <!-- 新增评价记录菜单 -->
          <el-menu-item index="3">
            <el-icon><Star /></el-icon>
            <span>评价记录</span>
          </el-menu-item>
        </el-menu>

      </el-card>
    </div>

    <!-- 右侧 -->
    <div class="right-card">
      <!-- 顶部统计大屏 -->
      <div class="stat-board">
        <div class="stat-item">
          <div class="stat-num">{{ statData.publishCount }}</div>
          <div class="stat-label">已发布</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ statData.borrowCount }}</div>
          <div class="stat-label">已借用</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ statData.ownerCount }}</div>
          <div class="stat-label">被借用</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ userInfo.creditScore }}</div>
          <div class="stat-label">信用积分</div>
        </div>
      </div>

      <el-card>
        <!-- 个人信息 -->
        <div v-if="activeMenu === '1'">
          <h3 class="title">个人信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="真实姓名">{{ userInfo.realName }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ userInfo.studentId }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ userInfo.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ userInfo.createTime }}</el-descriptions-item>
          </el-descriptions>

          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <el-button type="primary" plain @click="openEditDialog">
              编辑个人资料
            </el-button>
          </div>
        </div>

        <!-- 隐私设置 -->
        <div v-if="activeMenu === '2'">
          <h3 class="title">隐私设置</h3>
          <el-form label-width="150px">
            <el-form-item label="允许获取位置" prop="showLocation">
              <el-switch v-model="privacy.showLocation" :active-value="1" :inactive-value="0"/>
            </el-form-item>
            <el-form-item label="允许手机号公开" prop="showPhone">
              <el-switch v-model="privacy.showPhone" :active-value="1" :inactive-value="0"/>
            </el-form-item>
            <el-form-item label="接收消息通知" prop="receiveMsg">
              <el-switch v-model="privacy.receiveMsg" :active-value="1" :inactive-value="0"/>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="savePrivacy">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 新增：评价记录 & 申诉处理 -->
        <div v-if="activeMenu === '3'">
          <h3 class="title">我的评价记录</h3>
          <el-table :data="evaluateList" border stripe style="width:100%" size="small">
            <el-table-column label="评价对象" prop="transactionId" align="center"/>
            <el-table-column label="关联评价" prop="id" align="center"/>
            <el-table-column label="评价星级" align="center">
              <template #default="scope">
                <el-rate v-model="scope.row.score" disabled size="small"/>
              </template>
            </el-table-column>
            <el-table-column label="评价内容" prop="content" align="center"/>
            <el-table-column label="评价时间" prop="createTime" align="center"/>
            <el-table-column label="评价状态" align="center">
              <template #default="scope">
                <span :class="scope.row.status === 1 ? 'text-green' : 'text-red'">
                  {{ scope.row.status === 1 ? '正常' : '已扣分' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="150">
              <template #default="scope">
                <el-button
                    type="warning"
                    size="small"
                    text
                    @click="openAppealDialog(scope.row)"
                    v-if="scope.row.status == 1"
                >
                  提交申诉
                </el-button>
                <span v-else class="text-gray">无需申诉</span>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
              v-model:current-page="evaluatePage"
              v-model:page-size="evaluateSize"
              :total="evaluateTotal"
              layout="total, prev, pager, next"
              @current-change="getEvaluateList"
              style="margin-top:15px;justify-content:flex-end;display:flex"
          />

          <el-divider content-position="left">我的申诉记录</el-divider>
          <el-table :data="appealList" border stripe style="width:100%" size="small">
            <el-table-column label="关联评价" prop="evaluateId" align="center"/>
            <el-table-column label="申诉理由" prop="appealReason" align="center"/>
            <el-table-column label="提交时间" prop="createTime" align="center"/>
            <el-table-column label="申诉状态" align="center">
              <template #default="scope">
                <el-tag
                    :type="scope.row.appealStatus===0?'info':scope.row.appealStatus===1?'success':'danger'"
                    size="small"
                >
                  {{ scope.row.statusName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="平台回复" prop="replyContent" align="center"/>
          </el-table>
        </div>
      </el-card>
    </div>

    <!-- 编辑资料弹窗 -->
    <el-dialog
        v-model="dialogVisible"
        title="编辑个人资料"
        width="700px"
        destroy-on-close
    >
      <el-form :model="editForm" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editForm.realName" disabled />
        </el-form-item>
        <el-form-item label="学号/工号" prop="studentId">
          <el-input v-model="editForm.studentId" disabled />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 申诉弹窗 -->
    <el-dialog
        v-model="appealDialogVisible"
        title="评价申诉"
        width="600px"
        destroy-on-close
    >
      <el-form :model="appealForm" ref="appealFormRef" label-width="100px" label-position="right">

        <!-- 被申诉评价内容（只读） -->
        <el-form-item label="评价内容">
          <div style="padding:10px;background:#f7f8fa;border-radius:4px;">
            {{ appealForm.evaContent || '无内容' }}
          </div>
        </el-form-item>

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

        <!-- 证据图片上传 -->
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
        <el-button type="primary" @click="submitAppeal">提交申诉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { User, Lock, Star, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userInfo = ref({})
const activeMenu = ref('1')
const privacy = ref({
  showLocation: 0,
  showPhone: 0,
  receiveMsg: 0
})

// 统计数据
const statData = ref({
  publishCount: 0,
  borrowCount: 0,
  ownerCount: 0
})

// ========== 评价 & 申诉相关数据 ==========
const evaluateList = ref([])
const evaluatePage = ref(1)
const evaluateSize = ref(10)
const evaluateTotal = ref(0)

const appealList = ref([])
const appealDialogVisible = ref(false)
const appealForm = reactive({
  evaluateId: '',
  evaContent: '',
  appealReason: '',
  evidencePicList: []
})
const evidenceFileList = ref([])

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
      privacy.value.showLocation = userInfo.value.showLocation || 0
      privacy.value.showPhone = userInfo.value.showPhone || 0
      privacy.value.receiveMsg = userInfo.value.receiveMsg || 0
      loadStatCount()
      getEvaluateList()
      getAppealList()
    }
  } catch (err) {
    sessionStorage.clear()
    router.push('/')
  }
}

// 头像上传成功
const handleAvatarSuccess = (res) => {
  if (res.code === "200") {
    userInfo.value.avatar = res.data
    request.put('/user/update', {
      id: userInfo.value.id,
      avatar: res.data
    }).then(r => {
      if (r.code === "200") {
        ElMessage.success('头像上传成功')
        sessionStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        location.reload()
      }
    }).catch(err => {
      ElMessage.error(err.msg || '头像更新失败')
    })
  }
}

// 加载统计
const loadStatCount = async () => {
  try {
    const res1 = await request.get('/shareResource/myCount')
    if (res1.code === '200') statData.value.publishCount = res1.data
    const res2 = await request.get('/transaction/myBorrowCount')
    if (res2.code === '200') statData.value.borrowCount = res2.data
    const res3 = await request.get('/transaction/myOwnerCount')
    if (res3.code === '200') statData.value.ownerCount = res3.data
  } catch (e) {
    ElMessage.error('统计数据加载失败')
  }
}

// 菜单切换
const handleMenuSelect = (index) => {
  activeMenu.value = index
  if(index === '3'){
    getEvaluateList()
    getAppealList()
  }
}

// ========== 评价记录接口 ==========
const getEvaluateList = async () => {
  try {
    const params = { pageNum: evaluatePage.value, pageSize: evaluateSize.value }
    const res = await request.get('/comment/mylist', { params })
    if(res.code === "200"){
      evaluateList.value = res.data.list
      evaluateTotal.value = res.data.total
    }
  } catch (e) {
    ElMessage.error('评价记录加载失败')
  }
}

// ========== 申诉相关 ==========
const openAppealDialog = (row) => {
  request.get("/appeal/checkExist", {
    params: { evaluateId: row.id }
  }).then(res => {
    if (res.data) {
      ElMessage.warning("该评价已提交过申诉！")
    } else {
      appealForm.evaluateId = row.id
      appealForm.evaContent = row.content
      appealForm.appealReason = ''
      appealDialogVisible.value = true
    }
  }).catch(() => {
    ElMessage.error('校验失败')
  })
}

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
  try {
    const res = await request.post('/appeal/submit', appealForm)
    if(res.code === "200"){
      ElMessage.success('申诉提交成功，等待管理员审核')
      appealDialogVisible.value = false
      getAppealList()
    }else{
      ElMessage.error(res.message || '提交失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '申诉提交失败')
  }
}

// 获取我的申诉列表
const getAppealList = async () => {
  try {
    const res = await request.get('/appeal/myAppealList')
    if(res.code === "200"){
      appealList.value = res.data
    }
  } catch (e) {
    ElMessage.error('申诉记录加载失败')
  }
}

// 隐私设置保存
const savePrivacy = async () => {
  try {
    const params = {
      ...userInfo.value,
      showLocation: privacy.value.showLocation,
      showPhone: privacy.value.showPhone,
      receiveMsg: privacy.value.receiveMsg
    }
    const res = await request.put('/user/update', params)
    if (res.code === "200") {
      ElMessage.success('保存成功')
      fetchUserInfo()
    }
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}

// 编辑资料
const dialogVisible = ref(false)
const formRef = ref(null)
const editForm = reactive({})
const rules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  email: [
    { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: '邮箱格式错误', trigger: 'blur' }
  ]
}

const openEditDialog = () => {
  Object.assign(editForm, userInfo.value)
  dialogVisible.value = true
}

const submitEdit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await request.put('/user/update', editForm)
      if (res.code === "200") {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        fetchUserInfo()
      } else {
        ElMessage.error(res.message || '保存失败')
      }
    } catch (e) {
      ElMessage.error(e.message || '保存失败')
    }
  })
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.stat-board {
  width: 100%;
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.stat-item {
  flex: 1;
  background: linear-gradient(135deg, #409eff 10%, #69b1ff 100%);
  color: white;
  padding: 24px 16px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(64,158,255,0.2);
}
.stat-num {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 6px;
}
.stat-label {
  font-size: 15px;
  opacity: 0.9;
}

.profile-page {
  display: flex;
  flex-wrap: nowrap;
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: flex-start;
  overflow-x: auto;
}

.left-card {
  width: 280px;
  flex-shrink: 0;
}

.right-card {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-info {
  text-align: center;
}
.name {
  margin: 10px 0 5px;
  font-size: 18px;
}
.text-gray {
  color: #666;
  margin: 4px 0;
}
.text-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.left-menu {
  border: none;
}
.title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}
.text-green{
  color:#67c23a;
}
.text-red{
  color:#f56c6c;
}
</style>