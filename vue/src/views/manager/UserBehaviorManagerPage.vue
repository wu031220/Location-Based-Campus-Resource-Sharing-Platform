<template>
  <div>
    <!-- 查询条件 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input style="width: 180px; margin-right: 5px" v-model="data.userId" placeholder="用户ID" />
      <el-input style="width: 180px; margin-right: 5px" v-model="data.resourceId" placeholder="资源ID" />
      <el-select v-model="data.type" placeholder="行为类型" style="width: 160px; margin-right: 5px">
        <el-option label="全部" :value="null" />
        <el-option label="浏览" :value="1" />
        <el-option label="收藏" :value="2" />
        <el-option label="申请借用" :value="3" />
      </el-select>
      <el-button @click="load" type="primary">查询</el-button>
      <el-button @click="reset" type="info">重置</el-button>
    </div>

    <!-- 表格 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <div style="margin-bottom: 10px">
        <el-button @click="handleAdd" type="info">新增</el-button>
      </div>
      <el-table :data="data.tableData" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="100" />

        <!-- 用户账号显示 -->
        <el-table-column label="用户账号" width="130">
          <template #default="scope">
            {{ (data.userList || []).find(u => u.id === scope.row.userId)?.username || '未知' }}
          </template>
        </el-table-column>

        <el-table-column prop="resourceId" label="资源ID" width="110" />
        <el-table-column prop="type" label="行为类型" width="120">
          <template #default="scope">
            <el-tag :type="
                scope.row.type === 1 ? 'primary' :
                scope.row.type === 2 ? 'warning' : 'success'
              ">
              {{
                scope.row.type === 1 ? '浏览' :
                    scope.row.type === 2 ? '收藏' :
                        scope.row.type === 3 ? '申请借用' : '未知'
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" min_width="180" />

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

    <!-- 弹窗 -->
    <el-dialog v-model="data.dialogVisible" title="用户行为信息" width="600px" destroy-on-close>
      <el-form :model="data.form" :rules="data.rules" ref="formRef" label-width="120px">
        <el-form-item label="用户" prop="userId" required>
          <el-select v-model="data.form.userId" filterable style="width: 100%">
            <el-option
                v-for="user in data.userList"
                :key="user.id"
                :label="user.username + ' (' + (user.realName || '无') + ')'"
                :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="资源ID" prop="resourceId" required>
          <el-select
              v-model="data.form.resourceId"
              style="width: 400px"
              placeholder="请选择资源"
              @change="setOwnerId"
              filterable
              clearable
          >
            <template #default>
              <el-option
                  v-for="item in data.resourceList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
              />
            </template>
          </el-select>
        </el-form-item>

        <el-form-item label="行为类型" prop="type" required>
          <el-radio-group v-model="data.form.type">
            <el-radio :label="1">浏览</el-radio>
            <el-radio :label="2">收藏</el-radio>
            <el-radio :label="3">申请借用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="data.dialogVisible = false">取消</el-button>
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
  resourceId: null,
  type: null,

  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 10,
  dialogVisible: false,
  userList: [],
  resourceList: [],

  form: {
    id: '',
    userId: '',
    resourceId: '',
    type: 1
  },

  rules: {
    userId: [{ required: true, message: "请选择用户", trigger: "change" }],
    resourceId: [{ required: true, message: "请输入资源ID", trigger: "blur" }],
    type: [{ required: true, message: "请选择行为类型", trigger: "change" }]
  }
});

// 加载列表
const load = () => {
  request.get('/userBehavior/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      userId: data.userId,
      resourceId: data.resourceId,
      type: data.type
    }
  }).then(res => {
    if (res.code === "200") {
      data.tableData = res.data?.list || [];
      data.total = res.data?.total || 0;
    }
  });
};

const loadResourceList = () => {
  request.get("/shareResource/selectPage", {
    params: { pageNum: 1, pageSize: 1000 },
  }).then((res) => {
    data.resourceList = res.data.list || [];
  });
};

// 加载用户
const loadUserList = () => {
  request.get("/user/selectPage", {
    params: { pageNum: 1, pageSize: 1000 },
  }).then((res) => {
    data.userList = res.data.list || [];
  });
};

// 重置
const reset = () => {
  data.userId = null;
  data.resourceId = null;
  data.type = null;
  load();
};

// 删除
const del = (id) => {
  request.delete('/userBehavior/delete/' + id).then(res => {
    if (res.code === "200") {
      ElMessage.success("删除成功");
      load();
    }
  });
};

// 新增
const add = () => {
  request.post('/userBehavior/add', data.form).then(res => {
    if (res.code === "200") {
      ElMessage.success("新增成功");
      data.dialogVisible = false;
      load();
    }
  });
};

// 修改
const update = () => {
  request.put('/userBehavior/update', data.form).then(res => {
    if (res.code === "200") {
      ElMessage.success("修改成功");
      data.dialogVisible = false;
      load();
    }
  });
};

// 保存
const save = () => {
  formRef.value.validate(valid => {
    if (valid) {
      data.form.id ? update() : add();
    }
  });
};

// 新增
const handleAdd = () => {
  data.form = {
    id: '',
    userId: '',
    resourceId: '',
    type: 1
  };
  data.dialogVisible = true;
};

// 编辑
const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row));
  data.dialogVisible = true;
};

onMounted(() => {
  load();
  loadUserList();
  loadResourceList();
});
</script>