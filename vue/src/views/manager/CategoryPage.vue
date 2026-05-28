<template>
  <div>
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input style="width: 260px" v-model="data.name" placeholder="请输入类别名称" :prefix-icon="Search" />
      <el-button style="margin-left: 10px" @click="load" type="primary">查询</el-button>
      <el-button style="margin-left: 10px" @click="reset">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <div style="margin-bottom: 10px">
        <el-button type="info" @click="handleAdd">新增</el-button>
      </div>
      <div>
        <el-table :data="data.tableData" stripe style="width: 100%">
          <el-table-column prop="name" label="类别" min-width="180" />
          <el-table-column prop="typeId" label="类别id" min-width="180" />
          <el-table-column label="操作" width="180px" fixed="right">
            <template #default="scope">
              <el-button @click="handleEdit(scope.row)" type="primary">编辑</el-button>
              <el-button @click="del(scope.row.id)" type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-pagination v-model:current-page="data.pageNum" v-model:page-size="data.pageSize"
                     @current-change="load" layout="total,prev,  pager, next" :total="data.total" />
    </div>
  </div>

  <el-dialog v-model="data.dialogFormVisible" title="类别信息" width="500" destrony-on-close>
    <el-form :model="data.form" :rules="data.rules" ref="formRef">
      <el-form-item prop="name" label="类别">
        <el-input v-model="data.form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item prop="typeId" label="类别id">
        <el-input v-model="data.form.typeId" autocomplete="off" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="data.dialogFormVisible = false">Cancel</el-button>
        <el-button type="primary" @click="save">Confirm</el-button>
      </div>
    </template>
  </el-dialog>

</template>

<script setup>
import { reactive,onMounted,ref } from "vue";
import { Search } from "@element-plus/icons-vue"
import request from "@/utils/request";
import {ElMessage} from "element-plus";

const formRef=ref()
const data = reactive({
  name: null,
  tableData: [],
  total: 1,
  pageNum: 1,
  pageSize: 5,
  dialogFormVisible: false,
  form: {},
  rules: {
    name: [
      { required: true , message: "请输入类别", trigger: 'blur'},
    ],
    typeId: [
      { required: true , message: "请输入Id", trigger: 'blur'},
    ]
  }
})
const load = () => {
  request.get('/category/selectPage',{
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      name: data.name
    }
  }).then(res =>{
    if (res.code === "200") {
      data.tableData = res.data?.list
      data.total = res.data?.total
    }else {
      ElMessage.error(res.message)
    }
  })
}
const reset = () => {
  data.name=null
  load()
}
const del = (id) => {
  request.delete('/category/delete/' + id ).then(res =>{
    if (res.code === "200") {
      ElMessage.success('操作成功')
      load()
    }else {
      ElMessage.error(res.message)
    }
  })
}

const add = () =>{
  request.post('/category/add',data.form).then(res =>{
    if (res.code === "200") {
      ElMessage.success('操作成功')
      data.dialogFormVisible = false
      load()
    }else {
      ElMessage.error(res.message)
    }
  })
}
const update = () =>{
  request.put('/category/update',data.form).then(res =>{
    if (res.code === "200") {
      ElMessage.success('操作成功')
      data.dialogFormVisible = false
      load()
    }else {
      ElMessage.error(res.message)
    }
  })
}
const save = () => {
  formRef.value.validate ((valid) => {
    if(valid){
      if(data.form.id){
        update()
      }
      else{
        add()
      }
    }
  })
}
const handleAdd = () => {
  formRef.value?.clearValidate()
  data.form = {}
  data.dialogFormVisible = true
}
const handleEdit = (row) => {
  formRef.value?.clearValidate()
  data.form = JSON.parse(JSON.stringify(row))
  data.dialogFormVisible = true
}
onMounted(load);
</script>
