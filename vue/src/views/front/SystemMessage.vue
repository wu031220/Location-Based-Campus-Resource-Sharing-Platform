<template>
  <div class="message-center">
    <div class="header">
      <h2>系统消息</h2>

    </div>

    <div class="message-list">
      <el-button type="primary" icon="check-all" @click="readAll" :disabled="loading" style="position: absolute; right: 20px;margin-top: 10px">全部已读
      </el-button>
      <!--  Loading 替换成 el-skeleton  -->
      <div v-if="loading" class="loading">
        <el-skeleton active />
      </div>

      <div v-else-if="messages.length === 0" class="empty">
        <el-empty description="暂无消息" />
      </div>

      <div v-else>
        <div
            v-for="msg in messages"
            :key="msg.msgId"
            class="message-item"
            :class="{ unread: msg.isRead === 0 }"
            @click="readMessage(msg.msgId)"
        >
          <div class="icon">
            <el-icon :color="getIconColor(msg.type)">
              <component :is="getIcon(msg.type)" />
            </el-icon>
          </div>
          <div class="content">
            <h3 class="title">{{ msg.title }}</h3>
            <p class="text">{{ msg.content }}</p>
            <div class="meta">
              <span class="time">{{ msg.createTimeStr }}</span>
              <span v-if="msg.isRead === 0" class="status">未读</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import request from "@/utils/request";
import { ElMessage } from "element-plus";
import { Message, Notification, Clock, InfoFilled } from '@element-plus/icons-vue'

const messages = ref([]);
const loading = ref(false);

const loadMessages = async () => {
  loading.value = true;
  try {
    const res = await request.get("/usermessage/list");
    if (res.code === "200") {
      messages.value = res.data;
    }
  } catch (e) {
    ElMessage.error("加载失败");
  } finally {
    loading.value = false;
  }
};

const readMessage = async (msgId) => {
  await request.post(`/usermessage/read/${msgId}`);
  messages.value.forEach((m) => {
    if (m.msgId === msgId) m.isRead = 1;
  });
  if (window.parent && window.parent.location) {
    window.parent.location.reload();
  }
};

const readAll = async () => {
  await request.post("/usermessage/readAll");
  messages.value.forEach((m) => (m.isRead = 1));
  if (window.parent && window.parent.location) {
    window.parent.location.reload();
  }
  ElMessage.success("全部已读");
};

const getIcon = (type) => {
  switch (type) {
    case 1: return Message;
    case 2: return Notification;
    case 3: return Clock;
    case 4: return InfoFilled;
    default: return Message;
  }
};

const getIconColor = (type) => {
  switch (type) {
    case 1: return "#409eff";
    case 2: return "#67c23a";
    case 3: return "#f56c6c";
    case 4: return "#909399";
    default: return "#409eff";
  }
};

onMounted(() => {
  loadMessages();
});
</script>

<style scoped>
.message-center {
  max-width: 800px;
  margin: 5px auto;
  padding: 0 15px;
}
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0px;
}
.message-list {
  position: relative;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}
.loading {
  padding: 20px;
}
.empty {
  padding: 60px 0;
  text-align: center;
}
.message-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}
.message-item.unread {
  background: #f0f9ff;
}
.icon {
  margin-right: 15px;
}
.content {
  flex: 1;
}
.title {
  font-weight: bold;
  margin-bottom: 5px;
}
.text {
  color: #666;
  margin-bottom: 8px;
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}
.status {
  color: red;
}
</style>