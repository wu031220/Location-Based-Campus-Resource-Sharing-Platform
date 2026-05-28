<template>
  <div class="chat-page">
    <!-- 左侧用户列表 -->
    <div class="chat-left">
      <div class="chat-list-title">消息列表</div>
      <div class="user-list">
        <div
            v-for="item in userList"
            :key="item.id"
            class="user-item"
            :class="{ active: activeUserId === item.otherUserId }"
            @click="selectUser(item)"
        >
          <el-avatar :src="item.avatar" />
          <div class="info">
            <div class="name">{{ item.realName }}</div>
            <div class="msg">{{ item.lastMsg }}</div>
          </div>

          <div
              v-if="item.unread > 0 && activeUserId !== item.otherUserId"
              class="unread-badge"
          >
            {{ item.unread }}
          </div>

        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-right">
      <!-- 顶部信息 -->
      <div class="chat-header" v-if="activeUser">
        <el-avatar :src="activeUser.avatar" />
        <span class="username">{{ activeUser.realName }}</span>
      </div>

      <!-- 聊天内容 -->
      <div class="chat-content" ref="msgWrap">
        <div
            v-for="(msg, index) in msgList"
            :key="index"
            class="msg-item"
            :class="{ self: msg.self }"
        >
          <el-avatar :src="msg.self ? userInfo.avatar : activeUser.avatar" />
          <!-- 文字消息 -->
          <div v-if="!msg.isImg" class="msg-bubble">{{ msg.content }}</div>

          <!-- 图片消息 -->
          <img
              v-else
              :src="msg.imgUrl"
              class="msg-img"
              @click="previewImg(msg.imgUrl)"
          />
        </div>
      </div>

      <!-- 输入框 -->
      <!-- 输入框 -->
      <div class="chat-input">
        <input
            type="file"
            ref="imgInput"
            accept="image/*"
            style="display: none"
            @change="doUploadImg"
        />

        <!-- 输入框 -->
        <el-input
            v-model="inputMsg"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            @keyup.enter.exact="sendMsg"
        />

        <!-- 发送按钮 -->
        <el-button type="primary" @click="sendMsg">发送</el-button>

        <!-- 微信风格 加号菜单（放在最右侧） -->
        <el-dropdown trigger="click">
          <div class="plus-btn">+</div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openImgSelector">
                <i class="el-icon-camera" style="margin-right: 5px;"></i>
                发送图片
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick,onUnmounted, watch } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
const route = useRoute()

const userInfo = ref({})
const activeUser = ref(null)
const activeUserId = ref(null)
const msgList = ref([])
const inputMsg = ref('')
const msgWrap = ref(null)
const userList = ref([])
const imgInput = ref(null)


let pollTimer = null

// 开启轮询：选中聊天用户后，2秒拉一次最新记录
const startPoll = () => {
  // 先清空旧定时器，防止叠加
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(() => {

    getUserChat()
    // 只有选中聊天对象，才自动刷新消息
    if (activeUser.value?.otherUserId) {
      getMsgList()
    }
  }, 2000)
}

// 关闭轮询（页面销毁清除）
const stopPoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const getUserChat = async () => {
    const userRes = await request.get('/user/getCurrentUser')
    if (userRes.code !== "200" || !userRes.data?.id) return
    const userId = userRes.data.id
    userInfo.value = userRes.data

    // 后端返回每个会话的 unread
    const res = await request.get('/message/chatList', {
      params: { userId: userId }
    })
    if (res.code === "200") {
      let list = res.data;

      // 🔥 修复：当前正在聊天的人，强制 unread = 0，永远不显示红点
      if (activeUserId.value) {
        list = list.map(item => {
          if (item.otherUserId === activeUserId.value) {
            item.unread = 0
          }
          return item
        })
      }

      userList.value = list
    }
}



const selectUser = async (user) => {
  activeUser.value = user
  activeUserId.value = user.otherUserId
  msgList.value = []
  await getMsgList()
  scrollToBottom()
  await request.put('/message/clearUnread', null, {
    params: {
      userId: userInfo.value.id,
      otherId: user.otherUserId
    }
  })
  await getUserChat()
  startPoll()
}

const getMsgList = async () => {
  if (!activeUser.value) return

  const res = await request.get('/message/list', {
    params: {
      fromUserId: userInfo.value.id,
      toUserId: activeUser.value.otherUserId
    }
  })

  if (res.code === "200") {
    msgList.value = res.data.map(item => ({
      self: item.fromUserId === userInfo.value.id,
      content: item.content,
      isImg: item.isImg,      // 👈 加上
      imgUrl: item.imgUrl     // 👈 加上
    }))
    //scrollToBottom()
  }
}

const sendMsg = async () => {
  if (!inputMsg.value.trim()) return
  if (!activeUser.value) {
    ElMessage.warning('请选择聊天对象')
    return
  }

  const content = inputMsg.value.trim()
  inputMsg.value = ''
  msgList.value.push({ self: true, content, isImg: 0 })
  scrollToBottom()

  const res = await request.post('/message/send', {
    // fromUserId: userInfo.value.id, 👈 删掉
    toUserId: activeUser.value.otherUserId,
    content: content,
    isImg: 0,
    imgUrl: null
  })

  if (res.code !== "200") {
    ElMessage.error('发送失败')
  }
}

const openImgSelector = () => {
  imgInput.value.click()
}


const doUploadImg = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const fd = new FormData()
  fd.append('file', file)

  const res = await request.post('/file/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  if (res.code !== "200") return ElMessage.error('上传失败')
  const imgUrl = res.data

  // 本地渲染
  msgList.value.push({ self: true, isImg: 1, imgUrl })
  scrollToBottom()

  // 发送给后端
  await request.post('/message/send', {
    toUserId: activeUser.value.otherUserId,
    content: '',         // 👈 必须为空
    isImg: 1,
    imgUrl: imgUrl
  })
}

// 图片预览
const previewImg = (url) => {
  window.open(url)
}


const scrollToBottom = () => {
  nextTick(() => {
    if (msgWrap.value) {
      msgWrap.value.scrollTop = msgWrap.value.scrollHeight
    }
  })
}

const autoOpenChat = () => {
  const toUserId = route.query.toUserId
  if (!toUserId) return

  const unwatch = watch(
      () => userInfo.value.id,
      async (id) => {
        if (!id) return
        await createOrGetChat(toUserId)
        unwatch()
      },
      { immediate: true }
  )
}
const createOrGetChat = async (toUserId) => {
  try {
    await request.post('/message/createChat', null, {
      params: {
        userId: userInfo.value.id,
        otherId: toUserId
      }
    })
    // 创建成功 → 刷新会话列表
    await getUserChat()
    // 找到并打开
    const target = userList.value.find(u => u.otherUserId == toUserId)
    if (target) selectUser(target)
  } catch (err) {
    ElMessage.error('创建聊天失败')
  }
}

// 页面加载
onMounted(() => {
  getUserChat() // 页面加载：只拉列表，不清未读
  startPoll()
  autoOpenChat()
})

onUnmounted(() => {
  stopPoll()
})

</script>
<style scoped>
.chat-page {
  width: 80%;
  margin: 20px auto;
  display: flex;
  height: calc(100vh - 110px);
  box-shadow: 0 0 10px rgba(0,0,0,0.08);
  border-radius: 12px;
  overflow: hidden;
}

.chat-left {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.chat-list-title {
  padding: 16px;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #e4e7ed;
}

.user-list {
  flex: 1;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
}

.user-item:hover {
  background: #f5f7fa;
}

.user-item.active {
  background: #e8f3ff;
}

.user-item .info {
  flex: 1;
  overflow: hidden;
}

.user-item .name {
  font-weight: 500;
}

.user-item .msg {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-header {
  padding: 14px 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.chat-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========== ✅ 核心修复：头像永不被压缩 ========== */
.msg-item {
  display: flex;
  gap: 10px;
  max-width: 70%;
  align-items: flex-start; /* 顶部对齐 */
}
/* 强制头像不收缩、不挤压 */
.msg-item :deep(.el-avatar) {
  flex-shrink: 0 !important;
}

.msg-item.self {
  flex-direction: row-reverse;
  margin-left: auto;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e4e7ed;
  word-break: break-all;
  white-space: pre-wrap;
}

.msg-item.self .msg-bubble {
  background: #0088ff;
  color: #fff;
  border: none;
}

.send-btn {
  height: 56px;
}

.unread-badge {
  background-color: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 9px;
  min-width: 18px;
  text-align: center;
}
.msg-img {
  max-width: 200px;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px;
  background: #f5f5f5;
  border-top: 1px solid #eee;
}

/* 微信 + 号按钮 */
.plus-btn {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  font-size: 20px;
  color: #333;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
.plus-btn:hover {
  background: #f0f0f0;
}

</style>