<template>
  <div style="width: 100%;">

    <!-- 用户信息卡片 -->
    <div class="card" style="
      width: 70%;
      margin: 20px auto;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      background: #fff;
      padding: 20px;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center;">
          <el-avatar :size="70" :src="user.avatar" />
          <div style="margin-left: 15px;">
            <div style="font-size: 20px; font-weight: bold">{{ user.realName }}</div>
            <div style="color: #666; margin-top: 6px; font-size: 14px">
              信用积分：{{ user.creditScore || 0 }}
            </div>
          </div>
        </div>

        <el-button type="primary" @click="goChat">私信聊天</el-button>
      </div>
    </div>

    <!-- 他发布的资源 -->
    <div style="width: 70%; margin: 0 auto; font-size: 18px; font-weight: 500; margin-bottom: 15px">
      他发布的资源
    </div>

    <div v-if="resourceList.length === 0"
         style="width:70%; margin:0 auto; text-align:center; padding:40px; color:#999">
      暂无发布资源
    </div>

    <div v-else
         style="width:70%; margin:0 auto; display:grid; grid-template-columns: repeat(4,1fr); gap:15px;">
      <div
          v-for="item in resourceList"
          :key="item.id"
          style="background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.06);
                 overflow:hidden; cursor:pointer;"
          @click="goDetail(item.id)"
      >
        <div style="height:160px; overflow:hidden; border-radius:6px">
          <img
              :src="item.imgUrlList?.[0] || ''"
              style="width:100%; height:100%; object-fit:cover"
          />
        </div>
        <div style="padding:10px">
          <div style="font-weight:bold; margin-bottom:5px">{{ item.name }}</div>
          <div style="color:red; font-size:16px">￥{{ item.price }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import request from "@/utils/request";
import router from "@/router";
import { ElMessage } from "element-plus";

const userId = ref(router.currentRoute.value.query.userId);
const user = ref({});
const resourceList = ref([]);

// 加载用户信息
const loadUser = async () => {
  const res = await request.get("/user/selectById/" + userId.value);
  if (res.code === "200") {
    user.value = res.data;
  }
};

// 加载用户发布的资源 → ✅ 已适配你的后端
const loadUserResources = async () => {
  const res = await request.get("/shareResource/selectPage", {
    params: {
      userId: userId.value,
      pageNum: 1,
      pageSize: 100,
      distance: 0
    }
  });
  if (res.code === "200") {
    resourceList.value = res.data.list || [];
  }
};

// 去详情
const goDetail = (id) => {
  router.push({ path: "/front/resourceDetail", query: { id } });
};

// 私信
const goChat = async () => {
  const loginRes = await request.get("/user/getCurrentUser");
  if (loginRes.data.id === userId.value) {
    ElMessage.warning("不能和自己聊天");
    return;
  }
  router.push({
    path: "/front/message",
    query: { toUserId: userId.value }
  });
};

onMounted(() => {
  loadUser();
  loadUserResources();
});
</script>

<style scoped>
</style>