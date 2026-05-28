<template>
  <div>
    <!-- 查询条件 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input style="width: 180px; margin-right: 5px" v-model="data.fromUserId" placeholder="评价人ID" />
      <el-input style="width: 180px; margin-right: 5px" v-model="data.toUserId" placeholder="被评价人ID" />
      <el-input style="width: 180px; margin-right: 5px" v-model="data.orderId" placeholder="订单ID" />
      <el-button @click="load" type="primary">查询</el-button>
      <el-button @click="reset" type="info">重置</el-button>
    </div>

    <!-- 表格 -->
    <div class="card" style="background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <div style="margin-bottom: 10px">
        <el-button @click="handleAdd" type="primary">新增评论</el-button>
      </div>

      <el-table :data="data.tableData" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="评价人" min-width="100">
          <template #default="scope">
            {{
              data.userList.find(u => u.id === scope.row.fromUserId)?.username
              || '未知用户'
            }}
          </template>
        </el-table-column>
        <el-table-column label="被评价人" width="110">
          <template #default="scope">
            {{ (data.userList || []).find(u => u.id === scope.row.toUserId)?.username || '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="transactionId" label="订单ID" width="100" />
        <el-table-column prop="content" label="评论内容" min-width="300" />

        <el-table-column prop="score" label="评分" min-width="100" align="center">
          <template #default="scope">
            <el-rate v-model="scope.row.score" disabled size="small" />
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180" />

        <el-table-column label="操作" width="180px" fixed="right">
          <template #default="scope">
            <el-button @click="handleEdit(scope.row)" type="primary">编辑</el-button>
            <el-button @click="del(scope.row.id)" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="card" style="padding: 10px; margin-top: 5px; background: #fff; border-radius: 5px;">
      <el-pagination
          v-model:current-page="data.pageNum"
          v-model:page-size="data.pageSize"
          @current-change="load"
          layout="total, prev, pager, next"
          :total="data.total"
      />
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="data.dialogVisible" title="评论信息" width="550px" destroy-on-close>
      <el-form :model="data.form" :rules="data.rules" ref="formRef" label-width="100px">

        <el-form-item label="订单ID" prop="orderId" required>
          <el-select
              v-model="data.form.orderId"
              style="width: 400px"
              placeholder="请输入订单"
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

        <el-form-item label="评价人" prop="fromUserId" required>
          <el-select
              v-model="data.form.fromUserId"
              style="width: 400px"
              placeholder="请选择评价人"
              filterable
              clearable
          >
            <el-option v-for="user in data.userList" :key="user.id" :label="user.username" :value="user.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="被评价人" prop="toUserId" required>
          <el-select
              v-model="data.form.toUserId"
              style="width: 400px"
              placeholder="请选择被评价人"
              filterable
              clearable
          >
            <el-option v-for="user in data.userList" :key="user.id" :label="user.username" :value="user.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="评分" prop="score">
          <el-rate v-model="data.form.score" max="5" />
        </el-form-item>

        <el-form-item label="评论内容" prop="content">
          <el-input v-model="data.form.content" type="textarea" rows="4" />
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
import { reactive, onMounted, ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const formRef = ref()
const data = reactive({
  fromUserId: '',    // 评价人ID
  toUserId: '',      // 被评价人ID
  orderId: '',       // 订单ID
  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 10,
  dialogVisible: false,
  resourceList: [],
  userList: [],
  form: {
    id: '',
    orderId: '',        // 订单ID
    fromUserId: '',     // 评价人ID
    toUserId: '',       // 被评价人ID
    score: 5,
    content: '',
    status: 1
  },
  rules: {
    orderId: [{ required: true, message: '请输入订单ID', trigger: 'blur' }],
    fromUserId: [{ required: true, message: '请选择评价人', trigger: 'blur' }],
    toUserId: [{ required: true, message: '请选择被评价人', trigger: 'blur' }],
    content: [{ required: true, message: '请输入评论内容', trigger: 'blur' }]
  }
})

// 加载列表
const load = () => {
  request.get('/comment/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      orderId: data.orderId || null,
      fromUserId: data.fromUserId || null,
      toUserId: data.toUserId || null
    }
  }).then(res => {
    if (res.code === '200') {
      data.tableData = res.data.list || []
      data.total = res.data.total || 0
    }
  })
}

// 加载资源列表
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
  data.fromUserId = ''
  data.toUserId = ''
  data.orderId = ''
  load()
}

// 删除
const del = (id) => {
  request.delete('/comment/delete/' + id).then(res => {
    if (res.code === '200') {
      ElMessage.success('删除成功')
      load()
    }
  })
}

// 新增
const add = () => {
  request.post('/comment/add', data.form).then(res => {
    if (res.code === '200') {
      ElMessage.success('新增成功')
      data.dialogVisible = false
      load()
    }
  })
}

// 修改
const update = () => {
  request.put('/comment/update', data.form).then(res => {
    if (res.code === '200') {
      ElMessage.success('修改成功')
      data.dialogVisible = false
      load()
    }
  })
}

// 保存
const save = () => {
  formRef.value.validate(valid => {
    if (valid) {
      data.form.id ? update() : add()
    }
  })
}

// 新增
const handleAdd = () => {
  loadResourceList();
  loadUserList();
  data.form = {
    id: '',
    orderId: '',
    fromUserId: '',
    toUserId: '',
    score: 5,
    content: '',
    status: 1
  }
  data.dialogVisible = true
}

// 编辑
const handleEdit = (row) => {
  loadResourceList();
  loadUserList();
  data.form = { ...row }
  data.dialogVisible = true
}

onMounted(() => {
  load()
  loadUserList()
})
</script>