<template>
  <div>
    <!-- 查询区域 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input style="width: 260px" v-model="data.resourceName" placeholder="请输入资源名称" :prefix-icon="Search" />

      <el-select style="width: 150px; margin-left:10px" v-model="data.type" placeholder="交易类型" clearable>
        <el-option label="免费" :value="1" />
        <el-option label="付费" :value="2" />
        <el-option label="押金" :value="3" />
      </el-select>

      <el-select style="width: 130px; margin-left:10px" v-model="data.status" placeholder="交易状态" clearable>
        <el-option label="待确认" :value="0" />
        <el-option label="使用中" :value="1" />
        <el-option label="已完成" :value="2" />
        <el-option label="已取消" :value="3" />
      </el-select>

      <el-date-picker
          style="width: 230px; margin-left:10px"
          v-model="data.createTime"
          type="daterange"
          placeholder="申请时间"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
      />

      <el-button style="margin-left: 10px" @click="load" type="primary">查询</el-button>
      <el-button style="margin-left: 10px" @click="reset">重置</el-button>
    </div>

    <!-- 表格区域 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <div style="margin-bottom: 10px">
        <el-button type="info" @click="handleAdd">新增</el-button>
      </div>
      <div>
        <el-table :data="data.tableData" stripe style="width: 100%">
          <el-table-column prop="resourceName" label="资源名称" min-width="100" show-overflow-tooltip/>
          <el-table-column prop="ownerName" label="物主" min-width="80" />
          <el-table-column prop="borrowerName" label="借阅人" min-width="80" />
          <el-table-column prop="TypeName" label="交易类型" min-width="80" />
          <el-table-column prop="amount" label="金额" min-width="80" />
          <el-table-column prop="statusName" label="状态" min-width="90" />
          <el-table-column prop="startTime" label="开始时间" min-width="160" />
          <el-table-column prop="endTime" label="结束时间" min-width="160" />
          <el-table-column prop="applyTime" label="申请时间" min-width="160" />
          <el-table-column prop="returnTime" label="归还时间" min-width="160" />
          <el-table-column label="操作" width="180px" fixed="right">
            <template #default="scope">
              <el-button @click="handleEdit(scope.row)" type="primary">编辑</el-button>
              <el-button @click="del(scope.row.id)" type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 分页 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-pagination v-model:current-page="data.pageNum" v-model:page-size="data.pageSize"
                     @current-change="load" layout="total,prev,pager,next" :total="data.total" />
    </div>
  </div>

  <!-- 弹窗 -->
  <el-dialog v-model="data.dialogFormVisible" title="交易信息" width="50%" destroy-on-close>
    <el-form :model="data.form" :rules="data.rules" ref="formRef" label-width="100px" label-position="right">
      <el-form-item label="资源" prop="resourceId" required>
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

      <el-form-item label="借阅人" prop="borrowerId" required>
        <el-select
            v-model="data.form.borrowerId"
            style="width: 400px"
            placeholder="请选择借阅人"
            @change="checkBorrowerOwner"
            filterable
            default-first-option
            clearable
        >
        <el-option v-for="user in data.userList" :key="user.id" :label="user.username" :value="user.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="交易类型" prop="type" required>
        <el-select v-model="data.form.type" style="width: 400px">
          <el-option label="免费" :value="1" />
          <el-option label="付费" :value="2" />
          <el-option label="押金" :value="3" />
        </el-select>
      </el-form-item>

      <el-form-item label="金额" prop="amount" v-if="data.form.type === 2">
        <el-input-number :min="0" v-model="data.form.amount" style="width: 400px" />
      </el-form-item>

      <el-form-item label="状态" prop="status" required>
        <el-select v-model="data.form.status" style="width: 400px">
          <el-option label="待确认" :value="1" />
          <el-option label="使用中" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </el-form-item>

      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker v-model="data.form.startTime" type="datetime" style="width: 400px" />
      </el-form-item>

      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker v-model="data.form.endTime" type="datetime" style="width: 400px" />
      </el-form-item>

    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="data.dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, onMounted, ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import request from "@/utils/request";
import { ElMessage } from "element-plus";

const formRef = ref();

const data = reactive({
  resourceName: "",
  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 5,
  type: null,
  status: null,
  createTime: [],
  dialogFormVisible: false,
  form: {},
  rules: {
    resourceId: [{ required: true, message: "请选择资源", trigger: "change" }],
    borrowerId: [{ required: true, message: "请选择借阅人", trigger: "change" }],
    type: [{ required: true, message: "请选择类型", trigger: "change" }],
    status: [{ required: true, message: "请选择状态", trigger: "change" }],
    startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }],
    endTime: [{ required: true, message: "请选择结束时间", trigger: "change" }],
  },
  resourceList: [],
  userList: [],
});

// 加载列表
const load = () => {
  request.get("/transaction/selectPage", {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      resourceName: data.resourceName,
      type: data.type,
      status: data.status,
      startTime: data.createTime?.[0] || "",
      endTime: data.createTime?.[1] || "",
    },
  }).then((res) => {
    if (res.code === "200") {
      data.tableData = res.data.list;
      data.total = res.data.total;
    }
  });
};

// 重置
const reset = () => {
  data.resourceName = "";
  data.type = null;
  data.status = null;
  data.createTime = [];
  load();
};

// 删除
const del = (id) => {
  request.delete("/transaction/delete/" + id).then((res) => {
    if (res.code === "200") {
      ElMessage.success("删除成功");
      load();
    }
  });
};

// 新增
const add = () => {
  request.post("/transaction/add", data.form).then((res) => {
    if (res.code === "200") {
      ElMessage.success("新增成功");
      data.dialogFormVisible = false;
      load();
    }
  });
};

// 修改
const update = () => {
  request.put("/transaction/update", data.form).then((res) => {
    if (res.code === "200") {
      ElMessage.success("修改成功");
      data.dialogFormVisible = false;
      load();
    }
  });
};

// 保存
const save = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      data.form.id ? update() : add();
    }
  });
};

const handleAdd = () => {
  loadResourceList();
  loadUserList();
  data.form = { amount: 0 };
  data.dialogFormVisible = true;

};

const handleEdit = (row) => {
  loadResourceList();
  loadUserList();
  data.form = { ...row };
  data.dialogFormVisible = true;
};

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
const setOwnerId = (resourceId) => {
  let resource = data.resourceList.find(item => item.id === resourceId)
  if (resource) {
    data.form.ownerId = resource.userId
  }
}
const checkBorrowerOwner = () => {
  const form = data.form;
  // 如果借阅人 == 发布人（ownerId）
  if (form.borrowerId && form.ownerId && form.borrowerId === form.ownerId) {
    ElMessage.error("借阅人不能和发布者是同一个人！");
    // 清空选择
    form.borrowerId = null;
  }
};
onMounted(() => {
  load();
});
</script>