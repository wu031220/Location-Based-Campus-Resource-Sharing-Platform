<template>
  <div>
    <!-- 查询条件 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input style="width: 240px; margin-right: 5px" v-model="data.userId" placeholder="接收人ID/账号搜索" />
      <el-select v-model="data.type" placeholder="消息类型" style="width: 160px; margin-right: 5px">
        <el-option label="全部" :value="null" />
        <el-option label="申请通知" :value="1" />
        <el-option label="同意通知" :value="2" />
        <el-option label="归还提醒" :value="3" />
        <el-option label="订单消息" :value="4" />
      </el-select>
      <el-select v-model="data.isRead" placeholder="是否已读" style="width: 140px; margin-right: 5px">
        <el-option label="全部" :value="null" />
        <el-option label="未读" :value="0" />
        <el-option label="已读" :value="1" />
      </el-select>
      <el-button @click="load" type="primary">查询</el-button>
      <el-button @click="reset" type="info">重置</el-button>
    </div>

    <!-- 表格 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <div style="margin-bottom: 10px">
        <el-button @click="handleAdd" type="info">发送消息</el-button>
      </div>

      <el-table :data="data.tableData" stripe style="width: 100%">
        <el-table-column prop="msgId" label="消息ID" width="80" />
        <el-table-column prop="userId" label="接收人ID" width="100" />

        <!-- 显示用户名（修复find报错：加空数组保护） -->
        <el-table-column label="接收人账号" width="130">
          <template #default="scope">
            {{ (data.userList || []).find(u => u.id === scope.row.userId)?.username || '未知' }}
          </template>
        </el-table-column>

        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="content" label="消息内容" min-width="220" />

        <el-table-column prop="type" label="消息类型" width="110">
          <template #default="scope">
            <el-tag :type="
                scope.row.type === 1 ? 'primary' :
                scope.row.type === 2 ? 'success' :
                scope.row.type === 3 ? 'warning' : 'info'
              ">
              {{
                scope.row.type === 1 ? '申请通知' :
                    scope.row.type === 2 ? '同意通知' :
                        scope.row.type === 3 ? '归还提醒' :
                            scope.row.type === 4 ? '订单消息' : '未知'
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="isRead" label="是否已读" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.isRead === 1 ? 'success' : 'danger'">
              {{ scope.row.isRead === 1 ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="发送时间" width="180" />

        <!-- 操作列：改为 编辑 + 删除 -->
        <el-table-column label="操作" width="180px" fixed="right">
          <template #default="scope">
            <el-button @click="handleEdit(scope.row)" type="primary">编辑</el-button>
            <el-button @click="del(scope.row.id)" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-pagination v-model:current-page="data.pageNum" v-model:page-size="data.pageSize"
                     @current-change="load" layout="total,prev,pager,next" :total="data.total" />
    </div>

    <!-- 弹窗：新增/编辑消息 -->
    <el-dialog v-model="data.dialogFormVisible" title="消息信息" width="600px" destroy-on-close>
      <el-form :model="data.form" :rules="data.rules" ref="formRef" label-width="120px">
        <el-form-item label="接收用户" prop="userId" required>
          <el-select
              v-model="data.form.userId"
              filterable
              placeholder="请选择接收人"
              style="width: 100%"
              clearable
          >
            <el-option
                v-for="user in data.userList"
                :key="user.id"
                :label="user.username + ' (' + (user.realName || '无姓名') + ')'"
                :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="消息标题" prop="title" required>
          <el-input v-model="data.form.title" />
        </el-form-item>

        <el-form-item label="消息类型" prop="type" required>
          <el-radio-group v-model="data.form.type">
            <el-radio :label="1">申请通知</el-radio>
            <el-radio :label="2">同意通知</el-radio>
            <el-radio :label="3">归还提醒</el-radio>
            <el-radio :label="4">订单消息</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="消息内容" prop="content" required>
          <el-input v-model="data.form.content" type="textarea" rows="4" />
        </el-form-item>

        <el-form-item label="是否已读" prop="isRead">
          <el-switch v-model="data.form.isRead" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="data.dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from "vue";
import request from "@/utils/request";
import { ElMessage } from "element-plus";

const formRef = ref();
const data = reactive({
  userId: null,
  type: null,
  isRead: null,

  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 10,

  dialogFormVisible: false,
  userList: [], // 用户下拉列表

  form: {
    msgId: null,
    userId: null,
    title: '',
    content: '',
    type: 1,
    isRead: 0
  },

  rules: {
    userId: [{ required: true, message: "请选择接收人", trigger: "change" }],
    title: [{ required: true, message: "请输入标题", trigger: "blur" }],
    content: [{ required: true, message: "请输入内容", trigger: "blur" }],
    type: [{ required: true, message: "请选择类型", trigger: "change" }]
  }
});

// 加载消息列表
const load = () => {
  request.get('/usermessage/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      userId: data.userId,
      type: data.type,
      isRead: data.isRead
    }
  }).then(res => {
    if (res.code === "200") {
      data.tableData = res.data?.list || [];
      data.total = res.data?.total || 0;
    } else {
      ElMessage.error(res.message);
    }
  });
};

// 加载用户列表（用于下拉选择）
const loadUserList = () => {
  request.get("/user/selectPage", {
    params: { pageNum: 1, pageSize: 1000 },
  }).then((res) => {
    data.userList = res.data.list || [];
  });
};

// 重置查询
const reset = () => {
  data.userId = null;
  data.type = null;
  data.isRead = null;
  load();
};

// 删除消息
const del = (id) => {
  request.delete('/message/delete/' + id).then(res => {
    if (res.code === "200") {
      ElMessage.success('删除成功');
      load();
    } else {
      ElMessage.error(res.message);
    }
  });
};

// 新增（发送）消息
const add = () => {
  request.post('/message/send', data.form).then(res => {
    if (res.code === "200") {
      ElMessage.success('发送成功');
      data.dialogFormVisible = false;
      load();
    } else {
      ElMessage.error(res.message);
    }
  });
};

// 编辑更新消息
const update = () => {
  request.put('/message/update', data.form).then(res => {
    if (res.code === "200") {
      ElMessage.success('修改成功');
      data.dialogFormVisible = false;
      load();
    } else {
      ElMessage.error(res.message);
    }
  });
};

// 保存（区分新增/编辑）
const save = () => {
  formRef.value.validate(valid => {
    if (valid) {
      data.form.msgId ? update() : add();
    }
  });
};

// 打开新增弹窗
const handleAdd = () => {
  data.form = {
    msgId: null,
    userId: null,
    title: '',
    content: '',
    type: 1,
    isRead: 0
  };
  data.dialogFormVisible = true;
};

// 打开编辑弹窗（数据回显）
const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row)); // 深拷贝
  data.dialogFormVisible = true;
};

onMounted(() => {
  load();
  loadUserList();
});
</script>