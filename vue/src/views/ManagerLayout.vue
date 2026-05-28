<template>
  <el-container class="app-layout">
    <!-- 顶部栏 -->
    <el-header class="header-fixed">
      <div class="header-left">
        <img src="@/assets/logo.png" alt="Logo" class="logo" />
        <span class="title">校园资源共享平台后台</span>
      </div>
      <div class="header-right">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-icon :size="20"><Bell /></el-icon>
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
      <!-- 侧边栏 固定 -->
      <el-aside class="aside-fixed" :width="isCollapse ? '64px' : '200px'">
        <el-menu
            :default-active="activeMenu"
            class="menu"
            :collapse="isCollapse"
            router
            :default-openeds="['user','info']"
        >
          <el-menu-item index="/manager/dashboard">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="user">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/manager/user">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>

            <el-menu-item index="/manager/userbehavior">
              <el-icon><Plus /></el-icon>
              <span>用户行为管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="info">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>资源管理</span>
            </template>
            <el-menu-item index="/manager/category">
              <el-icon><Goods /></el-icon>
              <span>资源分类</span>
            </el-menu-item>
            <el-menu-item index="/manager/resource">
              <el-icon><Goods /></el-icon>
              <span>资源列表</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="transaction">
            <template #title>
              <el-icon><List /></el-icon>
              <span>交易与借用管理</span>
            </template>
            <el-menu-item index="/manager/transaction">
              <el-icon><List /></el-icon>
              <span>订单管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="comment">
            <template #title>
              <el-icon><Connection /></el-icon>
              <span>评价与信用管理</span>
            </template>
            <el-menu-item index="/manager/comment">
              <el-icon><Connection /></el-icon>
              <span>评价管理</span>
            </el-menu-item>
            <el-menu-item index="/manager/appealManage">
              <el-icon><Connection /></el-icon>
              <span>申诉管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="message">
            <template #title>
              <el-icon><Message /></el-icon>
              <span>消息管理</span>
            </template>
            <el-menu-item index="/manager/message">
              <el-icon><Message /></el-icon>
              <span>系统通知管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="setting">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统配置管理</span>
            </template>
            <el-menu-item index="/manager/setting">
              <el-icon><Setting /></el-icon>
              <span>系统配置管理</span>
            </el-menu-item>
          </el-sub-menu>

        </el-menu>

        <div class="collapse-btn" @click="toggleCollapse">
          <el-icon><Fold /></el-icon>
        </div>
      </el-aside>

      <!-- 内容区 -->
      <el-main class="main-content" :style="{ marginLeft: isCollapse ? '64px' : '200px' }">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, House, Goods, Plus, List, User, Fold } from '@element-plus/icons-vue'
import request from "@/utils/request";

const router = useRouter()
const isCollapse = ref(false)
const unreadCount = ref(0)
const userInfo = ref({})

const getUserInfo = async () => {
  try {
    const res = await request.get('/user/getCurrentUser')
    if (res.code === "200") {
      userInfo.value = res.data
      sessionStorage.setItem('userInfo', JSON.stringify(res.data))
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

const activeMenu = ref(router.currentRoute.value.path)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('user')
    router.push('/')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
:global(body) {
  margin: 0;
  padding: 0;
}
.app-layout {
  height: 100vh;
}
/* 顶部固定 */
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px !important;
}
/* 侧边栏固定 */
.aside-fixed {
  position: fixed;
  top: 60px;
  bottom: 0;
  left: 0;
  z-index: 998;
  background-color: #f5f5f5;
  transition: width 0.3s;
  overflow-y: auto;
}

/* 内容区自动适配 */
.main-content {
  margin-left: 200px;
  margin-top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  background-color: #f0f2f5;
  transition: margin-left 0.3s;
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
</style>