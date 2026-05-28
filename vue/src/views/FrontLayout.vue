<template>
  <el-container class="app-layout">
    <!-- 顶部栏 -->
    <el-header>
      <div class="header-left">
        <img src="@/assets/logo.png" alt="Logo" class="logo" />
        <span class="title">校园资源共享平台</span>
      </div>

      <div class="header-menu" style="width: 60%; display: flex; align-items: center; justify-content: center;">
        <el-menu mode="horizontal" :default-active="router.currentRoute.value.path" class="top-menu" router>
          <el-menu-item index="/front/home">首页</el-menu-item>
          <el-menu-item index="/front/publishresource">我的资源</el-menu-item>
          <el-menu-item index="/front/transaction">订单</el-menu-item>
          <el-menu-item index="/front/message">消息</el-menu-item>
          <el-menu-item index="/front/profile">个人中心</el-menu-item>
        </el-menu>
      </div>


      <div class="header-right">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-icon :size="20" @click="router.push('/front/sysmessage')"><Bell /></el-icon>
        </el-badge>
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :src="userInfo.avatar" />
            {{ userInfo.realName }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <!-- 内容区 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import request from "@/utils/request";

const router = useRouter()
const unreadCount = ref(0) // 实际从接口获取
const userInfo = ref({})

const getUserInfo = async () => {
  try {
    const res = await request.get('/user/getCurrentUser')
    if (res.code === "200") {
      userInfo.value = res.data
      // 存当前标签页的信息
      sessionStorage.setItem('userInfo', JSON.stringify(res.data))
    }

    const user = res.data

    // 如果 receive_msg = 0 → 不显示未读数
    if (user.receiveMsg === 0) {
      unreadCount.value = 0
      return // 直接结束，不请求未读数接口
    }

    const res1 = await request.get('/usermessage/unreadCount')
    if (res1.code === "200") {
      unreadCount.value = res1.data
    }

  } catch (err) {
    sessionStorage.clear()
    router.push('/')
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    ElMessage.success('已退出登录')
    router.push('/')
  } else if (command === 'profile') {
    router.push('/front/profile')
  }
}

onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
}
.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
}
.logo {
  height: 40px;
  margin-right: 10px;
}
.title {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.el-aside {
  background-color: #f5f5f5;
  transition: width 0.3s;
  position: relative;
}
.menu {
  border-right: none;
  background-color: #f5f5f5;
}
.collapse-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  font-size: 20px;
}
.el-main {
  background-color: #f0f2f5;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.el-menu--horizontal .el-menu-item.is-active{
  color: white;
  background-color: #e1e1e1;
}

</style>
<style>
/* 全局生效，没有 deep，不会报错 */
.el-menu--horizontal .el-menu-item {
  white-space: nowrap !important;
  overflow: visible !important;
  flex-shrink: 0 !important;
  min-width: fit-content !important;
  width: auto !important;
}

.top-menu {
  display: flex;
  justify-content: center;
  width: 100%;
}

.header-menu {
  width: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>