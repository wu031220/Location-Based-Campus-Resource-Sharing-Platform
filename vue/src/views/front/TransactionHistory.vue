<template>
  <el-card style="width:90%;margin:20px auto">
    <h3 style="margin:0 0 15px">交易历史记录</h3>

    <!-- 筛选区 -->
    <el-form :model="query" inline style="position: relative;margin-bottom:15px">
      <el-form-item label="资源名称">
        <el-input v-model="query.resourceName" placeholder="模糊搜索" clearable />
      </el-form-item>

      <el-form-item label="类型">
        <el-select v-model="query.type" placeholder="全部" clearable style="min-width: 100px">
          <el-option label="免费借用" value="1" />
          <el-option label="付费租赁" value="2" />
        </el-select>
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="min-width: 100px">
          <el-option label="已拒绝" value="2" />
          <el-option label="已完成" value="4" />
          <el-option label="退款完成" value="8" />
        </el-select>
      </el-form-item>

      <el-form-item label="时间范围">
        <el-date-picker
            v-model="query.timeRange"
            type="daterange"
            range-separator="~"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd"
        />
      </el-form-item>

      <el-form-item style="position: absolute;right: 20px">
        <el-button type="primary" @click="refresh">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table :data="list" border stripe size="small">
      <el-table-column prop="id" label="订单ID" width="70" />
      <el-table-column prop="resourceName" label="资源名称" />
      <el-table-column prop="TypeName" label="类型" width="100" />
      <el-table-column prop="ownerName" label="物主" width="120" />
      <el-table-column prop="borrowerName" label="借用人" width="120" />
      <el-table-column prop="startTime" label="开始时间" width="180" />
      <el-table-column prop="endTime" label="结束时间" width="180" />
      <el-table-column label="状态" width="110">
        <template #default="{row}">
          <el-tag :type="statusTag[row.status]">{{row.statusName}}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div style="display:flex;justify-content:flex-end;margin-top:15px">
      <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          layout="total,prev,pager,next"
          @current-change="refresh"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'

const user = ref({})
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const list = ref([])

const statusTag = {
  2: 'danger',
  4: 'success',
  8: 'info',
  10: 'success',
}

// 查询条件
const query = reactive({
  resourceName: '',
  type: null,
  status: null,
  timeRange: []
})

const resetQuery = () => {
  query.resourceName = ''
  query.type = 1
  query.status = null
  query.timeRange = []
  refresh()
}

const getUser = async () => {
  const res = await request.get('/user/getCurrentUser')
  if (res.code === "200") {
    user.value = res.data
    refresh()
  }
}

const refresh = async () => {
  const params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    userId: user.value.id,
    resourceName: query.resourceName,
    type: query.type,
    status: query.status,
    startTime: query.timeRange[0] || '',
    endTime: query.timeRange[1] || ''
  }
  const res = await request.get('/transaction/history', { params })
  if (res.code === "200") {
    list.value = res.data.list
    total.value = res.data.total
  }
}

onMounted(() => getUser())
</script>