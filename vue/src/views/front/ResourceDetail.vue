<template>
  <div>

    <!-- 顶部用户信息 -->
    <div class="card" style="
    width: 70%;
    height: 30px;
    margin: 10px auto;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    background: #fff;padding: 20px;display: flex; grid-gap: 20px"
    >
      <div style="display: flex;align-items: center" @click="goUserHome(data.owner.id)">
        <span><el-avatar :size="50" :src="data.owner.avatar" /></span>
        <div>
          <span style="margin-left: 10px">{{data.owner.realName}}</span>
          <div style="font-size: 15px;color: #666;margin-left: 10px">信用积分：{{data.owner.creditScore}}</div>
        </div>
      </div>
    </div>

    <!-- 商品详情 -->
    <div class="card" style="
    width: 70%;
    height: 400px;
    margin: 10px auto;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    background: #fff;padding: 20px;display: flex; grid-gap: 20px"
    >
      <div style="width: 50%; height: 400px; display: flex; align-items: center;">
        <el-carousel
            style="width: 100%; height: 400px; position: relative;"
            trigger="click"
            arrow="always"
        >
          <el-carousel-item v-for="img in data.resource.imgUrlList" :key="img">
            <img :src="img" style="width: 100%; height: 100%;
            object-fit: contain;
            object-position: center;" />
          </el-carousel-item>
        </el-carousel>
      </div>

      <div style="flex: fit-content">
        <div style="display: flex;align-items: center;margin-bottom: 1px">
          <div style="font-size: 25px;flex:1">{{data.resource.name}}</div>
          <div style="width: fit-content;cursor: pointer;color: #666">
            <el-icon
                style="position: relative;top: 3px; cursor: pointer"
                size="18"
                @click="handleCollect"
            >
              <Star v-if="isCollected" color="#ffad33" />
              <Star v-else />
            </el-icon>
            <span @click="handleCollect" style="margin-left:3px;cursor:pointer">
  {{ isCollected ? '已收藏' : '收藏' }}
</span>
          </div>
        </div>

        <div style="align-items: center">
          <div style="margin-bottom: 20px">
            <span style="color: red;font-size: 18px">￥</span><b style="color: red;font-size: 25px">{{data.resource.price}}</b>
            <span style="color: #666;margin-left: 20px">数量{{data.resource.stock}}</span>
          </div>

          <div style="padding: 30px;border-radius: 5px;background-color: #e6e6e6;line-height: 25px;text-align: justify;margin-bottom: 10px">{{data.resource.description}}</div>

          <!-- 位置 + 导航按钮 -->
          <div style="padding: 10px;border-radius: 5px;margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <div>位置：{{data.resource.locationDesc}}</div>
            <!-- ✅ 步行导航按钮 -->
            <el-button
                type="success"
                size="small"
                @click="goWalkNav"
            >
              🚶 步行导航
            </el-button>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;align-items: flex-end; gap: 10px; margin-top: auto;">
          <el-button
              style="height: 40px"
              type="warning"
              @click="goChat(data.resource.userId)"
          >
            聊一聊
          </el-button>
          <el-button style="height: 40px" type="danger" @click="applyResource">
            立即申请
          </el-button>
        </div>
      </div>
    </div>

    <!-- 评论区 -->
    <div class="card" style="
    width: 70%;
    margin: 10px auto;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    background: #fff;
    padding: 20px;
    grid-gap: 20px"
    >
      <div style="font-size: 18px; font-weight: 500; margin-bottom: 15px"><span>用户评价</span></div>

      <div v-if="commentList.length === 0" style="text-align: center; padding: 40px 0; color: #999">
        暂无评价
      </div>

      <div v-else>
        <div
            v-for="item in commentList"
            :key="item.id"
            style="margin: 0 20px; padding: 12px 0; border-bottom: 1px solid #f0f0f0"
        >
          <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
            <el-avatar :src="item.avatar" style="width: 40px; height: 40px;" />
            <div style="flex: 1">
              <div style="font-size: 15px; font-weight: 500; color: #333;">{{ item.fromUserRealName }}</div>
              <div style="font-size: 12px; color: #999; margin-top: 2px;">{{ item.createTimeStr }}</div>
              <div style="padding: 10px; color: #333; line-height: 1.5">{{ item.content }}</div>
            </div>

            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
              <el-icon color="#FFB800" size="16"><Star /></el-icon>
              <span style="font-size: 14px; color: #FFB800; font-weight: 500;">{{ item.score }}.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive,onMounted,ref } from "vue";
import router from "@/router";
import request from "@/utils/request";
import { ElMessage } from 'element-plus'
import { addUserBehavior,hasCollect, toggleCollect  } from '@/utils/userBehavior'
import { Star } from '@element-plus/icons-vue'

const data = reactive({
  id: router.currentRoute.value.query.id,
  resource: {},
  owner: {},
  number: 1,
  isCollected: false,
  isViewed: false,
})

// 加载数据
const load =  async() =>{
  await request.get('/shareResource/selectById/' + data.id).then(res =>{
    data.resource = res.data
  })
  await request.get('/user/selectById/' + data.resource.userId).then(res =>{
    data.owner = res.data
  })
  await initCollect()
  await loadComments();
}

// 当前登录用户
const loginUserId = ref('')
const getLoginUser = async () => {
  const res = await request.get('/user/getCurrentUser')
  if(res.code === '200'){
    loginUserId.value = res.data.id
  }
}
const goUserHome = (userId) => {
  router.push({
    path: "/front/userhome",
    query: { userId: userId }
  });
};

const checkSelfResource = () => {
  // 资源未加载 或 不是自己的资源 → 允许操作
  if (!data.resource?.userId || !loginUserId.value) return true;

  // 是自己的资源 → 拦截并提示
  if (loginUserId.value === data.resource.userId) {
    ElMessage.warning("不能操作自己发布的资源");
    return false;
  }
  return true;
};

// 聊天
const goChat = (publishUserId) => {
  if (!checkSelfResource()) return;
  if(loginUserId.value == publishUserId){
    ElMessage.warning('不能和自己发起聊天')
    return
  }
  router.push({ path: '/front/message', query: { toUserId: publishUserId } })
}

// 浏览记录
const recordView = async () => {
  if (data.isViewed) return
  try {
    await addUserBehavior({ resourceId: data.id, type: 1 })
    data.isViewed = true
  } catch (err) {
    console.error('❌ 浏览记录失败', err)
  }
}

// 收藏
const isCollected = ref(false)
const initCollect = async () => {
  const res = await hasCollect({ resourceId: data.id })
  isCollected.value = res.data
}
const handleCollect = async () => {
  if (!checkSelfResource()) return;
  await toggleCollect({ resourceId: data.id })
  isCollected.value = !isCollected.value
  ElMessage.success(isCollected.value ? '收藏成功' : '取消收藏')
}

const applyResource = () => {
  if(!checkSelfResource()) return
  if (data.resource.stock <= 0) {
    ElMessage.warning('该资源已被借完，无法申请，联系发布者')
    return
  }
  router.push({path: '/front/create',query: {resourceId: data.id,ownerId: data.resource.userId}})
}
// 评论
const commentList = ref([]);
const loadComments = async () => {
  const res = await request.get('/comment/list', {
    params: { resourceId: data.id }
  });
  if (res.code === '200') {
    commentList.value = res.data;
  }
};

// ✅【核心】跳转到步行导航页
const goWalkNav = () => {
  router.push({
    path: '/front/nav',
    query: {
      resourceId: data.id
    }
  })
}
onMounted(() => {
  load();
  getLoginUser();
  recordView()
});
</script>

<style>
.el-carousel__container {
  width: 100%;
  height: 100%;
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}
</style>