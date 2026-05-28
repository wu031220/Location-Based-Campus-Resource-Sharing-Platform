<template>
  <el-card style="width: 500px; margin: 40px auto; padding: 20px;">
    <h2 style="text-align: center; margin-bottom: 20px;">订单支付</h2>

    <!-- 订单信息 -->
    <div style="margin-bottom: 15px;">
      <span>订单号：</span>{{ order.id }}
    </div>
    <div style="margin-bottom: 15px;">
      <span>资源名称：</span>{{ order.resourceName }}
    </div>
    <div style="margin-bottom: 15px;">
      <span>应付金额：</span>
      <span style="font-size: 22px; color: red; font-weight: bold;">
        ¥{{ order.price }}
      </span>
    </div>

    <!-- 支付倒计时 -->
    <div style="color: #666; margin-bottom: 20px;">
      支付剩余时间：<span style="color: orange;">{{ countDownText }}</span>
    </div>

    <!-- 支付方式 -->
    <el-radio-group v-model="payType" style="margin-bottom: 20px;">
      <el-radio-button label="campus">校园统一支付</el-radio-button>
      <el-radio-button label="alipay">支付宝</el-radio-button>
      <el-radio-button label="wechat">微信支付</el-radio-button>
    </el-radio-group>

    <!-- 支付按钮 -->
    <el-button
        type="primary"
        size="large"
        style="width: 100%;"
        :loading="paying"
        @click="handlePay"
    >
      {{ paying ? '支付中...' : '立即支付' }}
    </el-button>

    <div style="margin-top: 15px; text-align: center;">
      <el-button type="text" @click="router.push('/front/transaction')">
        返回订单列表
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const order = reactive({
  id: '',
  resourceName: '',
  price: 0
})

const payType = ref('campus')
const paying = ref(false)

// 倒计时 15 分钟
const countDown = ref(15 * 60)
const countDownText = ref('15:00')
let timer = null

onMounted(() => {
  // 从路由参数获取订单ID和金额
  order.id = route.query.id
  order.price = Number(route.query.price) || 0
  order.resourceName = route.query.resourceName || '未知资源'

  startCountDown()
})

onUnmounted(() => {
  clearInterval(timer)
})

// 倒计时
function startCountDown() {
  timer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      clearInterval(timer)
      ElMessage.error('支付超时，订单已取消')
      router.push('/front/transaction')
      return
    }
    const m = String(Math.floor(countDown.value / 60)).padStart(2, '0')
    const s = String(countDown.value % 60).padStart(2, '0')
    countDownText.value = `${m}:${s}`
  }, 1000)
}

// 提交支付
async function handlePay() {
  paying.value = true
  try {
    // 调用后端支付接口
    const res = await request.post('/transaction/pay', null, {
      params: {
        id: order.id,
        payType: payType.value
      }
    })

    if (res.code === '200') {
      ElMessage.success('支付成功！')
      router.push('/front/transaction')
    } else {
      ElMessage.error(res.msg || '支付失败')
    }
  } catch (e) {
    ElMessage.error('支付异常')
  } finally {
    paying.value = false
  }
}
</script>

<style scoped>
.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>