<template>
  <div>
    <!-- 查询 -->
    <div class="card" style="margin-bottom: 5px; background: #fff; padding: 10px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input v-model="data.type" placeholder="字典类型" style="width: 200px; margin-right: 5px" />
      <el-input v-model="data.name" placeholder="字典名称" style="width: 200px; margin-right: 5px" />
      <el-button @click="load" type="primary">查询</el-button>
      <el-button @click="reset" type="info">重置</el-button>
    </div>

    <!-- 工具栏 -->
    <div class="card" style="margin-bottom: 5px; background: #fff; padding: 10px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-button type="primary" @click="handleAdd">新增字典</el-button>
    </div>

    <!-- 表格 -->
    <div class="card" style="background: #fff; padding: 10px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-table :data="data.tableData" stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="字典类型" width="160" />
        <el-table-column prop="code" label="字典编码" width="100" />
        <el-table-column prop="name" label="字典名称" min-width="180" />
        <el-table-column prop="description" label="备注" min-width="150" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" @click="del(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="card" style="margin-top:5px; background:#fff; padding:10px; border-radius:5px;">
      <el-pagination
          v-model:current-page="data.pageNum"
          v-model:page-size="data.pageSize"
          @current-change="load"
          layout="total, prev, pager, next"
          :total="data.total"
      />
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="data.dialogVisible" title="字典配置" width="550px" destroy-on-close>
      <el-form :model="data.form" :rules="data.rules" ref="formRef" label-width="100px">
        <el-form-item label="字典类型" prop="type">
          <el-input v-model="data.form.type" placeholder="例如：share_type、transaction_status" />
        </el-form-item>
        <el-form-item label="字典编码" prop="code">
          <el-input v-model="data.form.code" placeholder="数字编码 1、2、3..." />
        </el-form-item>
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="data.form.name" placeholder="显示名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="data.dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确认保存</el-button>
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
  type: '',
  name: '',
  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 10,
  dialogVisible: false,
  form: {},
  rules: {
    type: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
    code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
  }
})

// 加载列表
const load = () => {
  request.get('/dict/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      type: data.type,
      name: data.name
    }
  }).then(res => {
    if (res.code === '200') {
      data.tableData = res.data.list || []
      data.total = res.data.total || 0
    }
  })
}

// 重置
const reset = () => {
  data.type = ''
  data.name = ''
  load()
}

// 删除
const del = (id) => {
  request.delete('/dict/delete/' + id).then(res => {
    if (res.code === '200') {
      ElMessage.success('删除成功')
      load()
    } else {
      ElMessage.error(res.msg)
    }
  })
}

// 新增
const add = () => {
  request.post('/dict/add', data.form).then(res => {
    if (res.code === '200') {
      ElMessage.success('新增成功')
      data.dialogVisible = false
      load()
    } else {
      ElMessage.error(res.msg)
    }
  })
}

// 修改
const update = () => {
  request.put('/dict/update', data.form).then(res => {
    if (res.code === '200') {
      ElMessage.success('修改成功')
      data.dialogVisible = false
      load()
    } else {
      ElMessage.error(res.msg)
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

// 新增/编辑
const handleAdd = () => {
  formRef.value?.clearValidate()
  data.form = {}
  data.dialogVisible = true
}
const handleEdit = (row) => {
  formRef.value?.clearValidate()
  data.form = { ...row }
  data.dialogVisible = true
}

onMounted(load)
</script>