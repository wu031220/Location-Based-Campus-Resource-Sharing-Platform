<template>
  <div>
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
        <el-input style="width: 240px" v-model="data.name" placeholder="Type somthing" :prefix-icon="Search" />
        <el-button @click="load" type="primary" style="margin: 0 5px">查询</el-button>
        <el-button @click="reset" type="info">重置</el-button>
    </div>
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">

      <div style="margin-bottom: 10px">
        <el-button @click="handleAdd" type="info">新增</el-button>
      </div>
      <div>
        <el-table :data="data.tableData" stripe style="width: 100%">
          <el-table-column prop="username" label="账户" width="180" />
          <el-table-column prop="realName" label="姓名" width="180" />
          <el-table-column prop="avatar" label="头像" >
            <template #default="scope">
              <img v-if="scope.row.avatar" style="width: 50px;height: 50px; display: block;border-radius: 50%" :src="scope.row.avatar" alt="">
            </template>
          </el-table-column>
          <el-table-column prop="role" label="角色" />
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

  <el-dialog v-model="data.dialogFormVisible" title="用户信息" width="500" destrony-on-close>
    <el-form :model="data.form" :rules="data.rules" ref="formRef">
      <el-form-item prop="username" label="账号">
        <el-input :disabled="data.form.id !== undefined" v-model="data.form.username" autocomplete="off" />
      </el-form-item>
      <el-form-item prop="name" label="姓名">
        <el-input v-model="data.form.realName" autocomplete="off" />
      </el-form-item>
      <el-form-item prop="avatar" label="图片">
        <el-upload
            :action="'/api/file/upload'"
            list-type="picture"
            :on-success="handleFileUpload"
        >
          <el-button type="primary">点击上传</el-button>
        </el-upload>
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
    username: [
        { required: true , message: "请输入账号", trigger: 'blur'},
        ]
  }
})
const load = () => {
  request.get('/user/selectPage',{
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
  request.delete('/user/delete/' + id ).then(res =>{
    if (res.code === "200") {
      ElMessage.success('操作成功')
      load()
    }else {
      ElMessage.error(res.message)
    }
  })
}

const add = () =>{
  request.post('/user/add',data.form).then(res =>{
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
  request.put('/user/update',data.form).then(res =>{
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
  data.form = {}
  data.dialogFormVisible = true
}
const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row))
  data.dialogFormVisible = true
}
const handleFileUpload = (res) => {
  data.form.avatar = res.data
}
onMounted(load);
</script>
