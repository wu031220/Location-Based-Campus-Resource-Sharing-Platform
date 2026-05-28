<template>
  <div>
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input style="width: 240px" v-model="data.name" placeholder="姓名/账号搜索" :prefix-icon="Search" />
      <el-button @click="load" type="primary" style="margin: 0 5px">查询</el-button>
      <el-button @click="reset" type="info">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <div style="margin-bottom: 10px">
        <el-button @click="handleAdd" type="info">新增</el-button>
      </div>

      <el-table :data="data.tableData" stripe style="width: 100%" size="small">
        <el-table-column prop="username" label="账号" min-width="90"/>
        <el-table-column prop="realName" label="真实姓名" min-width="90"/>
        <el-table-column prop="studentId" label="学号/工号" min-width="90"/>
        <el-table-column prop="phone" label="手机号" min-width="90"/>
        <el-table-column prop="email" label="邮箱" min-width="90"/>


        <el-table-column prop="avatar" label="头像"  min-width="90">
          <template #default="scope">
            <img v-if="scope.row.avatar" style="width:40px;height:40px;border-radius:50%" :src="scope.row.avatar" alt="">
          </template>
        </el-table-column>

        <el-table-column prop="gender" label="性别" min-width="90">
          <template #default="scope">
            <span>{{ scope.row.gender === 1 ? '男' : scope.row.gender === 2 ? '女' : '未知' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="role" label="管理员角色" min-width="90">
          <template #default="scope">
            <el-tag :type="scope.row.role === 0 ? '' : 'success'">
              {{ scope.row.role === 0 ? '普通用户' : '管理员' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="identity" label="角色" min-width="90">
          <template #default="scope">
            <el-tag :type="scope.row.identity === 0 ? '' : 'success'">
              {{ scope.row.identity === 0 ? '学生' : '教职工' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="creditScore" label="信用分" min-width="90"/>

        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="canPublish" label="发布权限" min-width="90">
          <template #default="scope">
            <el-tag :type="scope.row.canPublish === 1 ? 'success' : 'danger'">
              {{ scope.row.canPublish === 1 ? '允许' : '禁止' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="canBorrow" label="借用权限">
          <template #default="scope">
            <el-tag :type="scope.row.canBorrow === 1 ? 'success' : 'danger'">
              {{ scope.row.canBorrow === 1 ? '允许' : '禁止' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="showLocation" label="公开位置">
          <template #default="scope">
            <span>{{ scope.row.showLocation === 1 ? '是' : '否' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="showPhone" label="公开手机">
          <template #default="scope">
            <span>{{ scope.row.showPhone === 1 ? '是' : '否' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="receiveMsg" label="消息提醒">
          <template #default="scope">
            <span>{{ scope.row.receiveMsg === 1 ? '开启' : '关闭' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180px" fixed="right">
          <template #default="scope">
            <el-button @click="handleEdit(scope.row)" type="primary">编辑</el-button>
            <el-button @click="del(scope.row.id)" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-pagination v-model:current-page="data.pageNum" v-model:page-size="data.pageSize"
                     @current-change="load" layout="total,prev,pager,next" :total="data.total" />
    </div>

    <el-dialog v-model="data.dialogFormVisible" title="用户信息" width="750px" destroy-on-close>
      <el-form :model="data.form" :rules="data.rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="登录账号" prop="username">
              <el-input v-model="data.form.username" :disabled="!!data.form.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="data.form.realName" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学号/工号">
              <el-input v-model="data.form.studentId" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="data.form.phone" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="data.form.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="data.form.gender">
                <el-radio :label="0">未知</el-radio>
                <el-radio :label="1">男</el-radio>
                <el-radio :label="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色">
              <el-radio-group v-model="data.form.identity">
                <el-radio :label="0">学生</el-radio>
                <el-radio :label="1">教职工</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="信用分">
              <el-input-number v-model="data.form.creditScore" :min="0" :max="200" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号状态">
              <el-radio-group v-model="data.form.status">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="头像上传">
              <el-upload :action="'/api/file/upload'" list-type="picture" :on-success="handleFileUpload">
                <el-button type="primary" size="small">上传</el-button>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发布资源权限">
              <el-switch v-model="data.form.canPublish" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="借用资源权限">
              <el-switch v-model="data.form.canBorrow" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公开位置">
              <el-switch v-model="data.form.showLocation" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公开手机号">
              <el-switch v-model="data.form.showPhone" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="接收消息提醒">
              <el-switch v-model="data.form.receiveMsg" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { Search } from "@element-plus/icons-vue";
import request from "@/utils/request";
import { ElMessage } from "element-plus";

const formRef = ref();
const data = reactive({
  name: null,
  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 10,
  dialogFormVisible: false,
  form: {

  },
  rules: {
    username: [
      { required: true, message: "请输入账号", trigger: 'blur' }
    ]
  }
});

const load = () => {
  request.get('/user/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      name: data.name
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

const reset = () => {
  data.name = null;
  load();
};

const del = (id) => {
  request.delete('/user/delete/' + id).then(res => {
    if (res.code === "200") {
      ElMessage.success('删除成功');
      load();
    } else {
      ElMessage.error(res.message);
    }
  });
};

const add = () => {
  request.post('/user/add', data.form).then(res => {
    if (res.code === "200") {
      ElMessage.success('新增成功');
      data.dialogFormVisible = false;
      load();
    } else {
      ElMessage.error(res.message);
    }
  });
};

const update = () => {
  request.put('/user/update', data.form).then(res => {
    if (res.code === "200") {
      ElMessage.success('修改成功');
      data.dialogFormVisible = false;
      load();
    } else {
      ElMessage.error(res.message);
    }
  });
};

const save = () => {
  formRef.value.validate(valid => {
    if (valid) {
      data.form.id ? update() : add();
    }
  });
};

const handleAdd = () => {
  data.form = {
    id: '',
    username: '',
    realName: '',
    studentId: '',
    phone: '',
    email: '',
    gender: 0,
    role: 0,
    creditScore: 100,
    status: 1,
    canPublish: 1,
    canBorrow: 1,
    showLocation: 1,
    showPhone: 0,
    receiveMsg: 1,
    avatar: ''
  };
  data.dialogFormVisible = true;
};

const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row));
  data.dialogFormVisible = true;
};

const handleFileUpload = (res) => {
  data.form.avatar = res.data;
};

onMounted(load);
</script>