<template>
  <div>
    <!-- 查询条件 -->
    <div class="card" style="margin-bottom: 5px; background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-input style="width: 180px; margin-right: 5px" v-model="data.evaluateId" placeholder="评价ID" />
      <el-button @click="load" type="primary">查询</el-button>
      <el-button @click="reset" type="info">重置</el-button>
    </div>

    <!-- 表格 -->
    <div class="card" style="background-color: #fff; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,.1);">
      <el-table :data="data.tableData" stripe style="width: 100%">
        <el-table-column prop="id" label="申诉ID" width="80" />
        <el-table-column prop="evaluateId" label="评价ID" width="100" />
        <el-table-column prop="orderId" label="订单ID" width="100" />
        <el-table-column prop="appealReason" label="申诉理由" min-width="200" />
        <el-table-column label="证据" width="150" align="center">
          <template #default="scope">
            <div v-if="scope.row.evidencePicList && scope.row.evidencePicList.length > 0">
              <el-image
                  v-for="(pic, idx) in scope.row.evidencePicList"
                  :key="idx"
                  :src="pic"
                  fit="cover"
                  style="width:40px;height:40px;margin-right:3px"
                  :preview-src-list="scope.row.evidencePicList"
                  preview-teleported
              />
            </div>
            <span v-else style="color:#999">无证据</span>
          </template>
        </el-table-column>
        <el-table-column label="申诉状态" width="120" align="center">
          <template #default="scope">
            <el-tag
                :type="
        scope.row.appealStatus === 0 ? 'warning' :
        scope.row.appealStatus === 1 ? 'success' :
        scope.row.appealStatus === 2 ? 'danger' : 'info'
      "
            >
              {{ scope.row.statusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="replyContent" label="平台回复" width="150" />
        <el-table-column prop="createTime" label="申诉时间" width="180" />

        <el-table-column label="操作" width="180px" fixed="right">
          <template #default="scope">
            <el-button
                v-if="scope.row.appealStatus === 0"
                type="success"
                @click="handleAudit(scope.row)"
            >
              审核
            </el-button>
            <el-button
                type="primary"
                @click="handleDetail(scope.row)"
            >
              查看
            </el-button>
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

    <!-- 审核弹窗 -->
    <el-dialog v-model="data.auditVisible" title="申诉审核" width="500px">
      <el-form label-width="100px">
        <el-form-item label="申诉ID">
          <span>{{ data.form.id }}</span>
        </el-form-item>
        <el-form-item label="申诉状态">
          <el-tag type="warning">待审核</el-tag>
        </el-form-item>
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="data.auditResult">
            <el-radio label="1">审核通过</el-radio>
            <el-radio label="2">审核驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="平台回复" required>
          <el-input
              v-model="data.replyContent"
              type="textarea"
              rows="3"
              placeholder="请填写审核意见/回复内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="data.auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确认提交</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="data.dialogVisible" title="申诉详情" width="550px" destroy-on-close>
      <div style="padding: 10px; line-height: 2.4;">
        <p><strong>申诉ID：</strong>{{ data.form.id }}</p>
        <p><strong>评价ID：</strong>{{ data.form.evaluateId }}</p>
        <p><strong>申诉原因：</strong>{{ data.form.appealReason }}</p>
        <p><strong>提交时间：</strong>{{ data.form.createTime }}</p>
        <p v-if="data.form.replyContent">
          <strong>平台回复：</strong>{{ data.form.replyContent }}
        </p>
      </div>
      <template #footer>
        <el-button @click="data.dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const data = reactive({
  evaluateId: '',
  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 10,
  dialogVisible: false,
  auditVisible: false,
  form: {},
  auditResult: 1,
  replyContent: ''
})

// 加载列表
const load = () => {
  request.get('/appeal/list', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      evaluateId: data.evaluateId || null
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
  data.evaluateId = ''
  load()
}

// 查看详情
const handleDetail = (row) => {
  data.form = { ...row }
  data.dialogVisible = true
}

// 审核通过
const handleAudit = (row) => {
  data.form = { ...row }
  data.auditResult = 1
  data.replyContent = ''
  data.auditVisible = true
}
// 提交审核
const submitAudit = () => {
  if (!data.replyContent) {
    ElMessage.warning('请填写平台回复')
    return
  }
  request.post('/appeal/audit', {
    id: data.form.id,
    appealStatus: data.auditResult,
    replyContent: data.replyContent
  }).then(res => {
    if (res.code === '200') {
      ElMessage.success('审核成功')
      data.auditVisible = false
      load()
    } else {
      ElMessage.error(res.msg || '审核失败')
    }
  })
}

onMounted(() => {
  load()
})
</script>