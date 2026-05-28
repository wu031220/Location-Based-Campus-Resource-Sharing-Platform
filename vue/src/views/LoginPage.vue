<template>
  <div class="home-container">
    <el-card class="home-card">
      <h2>校园资源共享平台</h2>

      <!-- 登录面板 -->
      <div v-show="activeTab === 'login'">
        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="学号/工号" prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleLogin" :loading="loginLoading" block>登录</el-button>
          </el-form-item>
        </el-form>
        <div class="links">
          <span @click="activeTab='reset'" class="link">忘记密码？</span>
          <span @click="activeTab='register'" class="link">没有账号？去注册</span>
        </div>
      </div>

      <!-- 注册面板 -->
      <div v-show="activeTab === 'register'">
        <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef">
          <el-form-item prop="phone">
            <el-input v-model="registerForm.phone" placeholder="手机号" />
          </el-form-item>
          <el-form-item prop="username">
            <el-input v-model="registerForm.username" placeholder="学号/工号" />
          </el-form-item>
          <el-form-item prop="realName">
            <el-input v-model="registerForm.realName" placeholder="真实姓名" autocomplete="off"/>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="registerForm.password" type="password" placeholder="密码" autocomplete="new-password"/>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" />
          </el-form-item>
          <el-form-item prop="college">
            <el-input v-model="registerForm.college" placeholder="学院（选填）" />
          </el-form-item>
          <el-form-item prop="role">
            <el-radio-group v-model="registerForm.role">
              <el-radio :label="0">学生</el-radio>
              <el-radio :label="1">教职工</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleRegister" :loading="registerLoading" block>注册</el-button>
          </el-form-item>
        </el-form>
        <div class="links-center">
          <span @click="activeTab='login'" class="link">已有账号？去登录</span>
        </div>
      </div>

      <!-- 找回密码（短信验证码） -->
      <div v-show="activeTab === 'reset'">
        <el-form :model="resetForm" :rules="resetRules" ref="resetFormRef">
          <el-form-item prop="phone">
            <el-input v-model="resetForm.phone" placeholder="绑定手机号" />
          </el-form-item>
          <el-form-item>
            <div class="code-row">
              <el-input v-model="resetForm.code" placeholder="短信验证码" autocomplete="off"/>
              <el-button @click="getResetCode" :disabled="resetCodeDisabled">
                {{ resetCodeText }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item prop="newPassword" >
            <el-input v-model="resetForm.newPassword" type="password" placeholder="新密码" autocomplete="new-password"/>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="resetForm.confirmPassword" type="password" placeholder="确认新密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleReset" :loading="resetLoading" block>重置密码</el-button>
          </el-form-item>
        </el-form>
        <div class="links-center">
          <span @click="activeTab='login'" class="link">返回登录</span>
        </div>
      </div>

    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/request'
import { ElMessage } from 'element-plus'
import request from "@/utils/request";

const router = useRouter()
const activeTab = ref('login')

// 登录
const loginForm = ref({ username: '', password: '' })
const loginLoading = ref(false)
const loginFormRef = ref(null)
const loginRules = {
  username: [{ required: true, message: '请输入学号/工号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 注册
const registerForm = ref({
  username: '',
  realName: '',
  password: '',
  confirmPassword: '',
  phone: '',
  college: '',
  role: 0
})
const registerLoading = ref(false)
const registerFormRef = ref(null)
const validateConfirm = (rule, value, callback) => {
  if (value !== registerForm.value.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}
const registerRules = {
  username: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号码', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }]
}

// 找回密码 - 短信验证
const resetForm = ref({
  username: '',
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})
const resetLoading = ref(false)
const resetFormRef = ref(null)
const validateResetPassword = (rule, value, callback) => {
  if (value !== resetForm.value.newPassword) {
    callback(new Error('两次新密码不一致'))
  } else {
    callback()
  }
}
const resetRules = {
  username: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入绑定手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入短信验证码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateResetPassword, trigger: 'blur' }]
}

// 找回密码 倒计时
const resetCodeText = ref('获取验证码')
const resetCodeDisabled = ref(false)
const getResetCode = async () => {
  if (!resetForm.value.phone) {
    ElMessage.warning('请先输入绑定手机号')
    return
  }
  // 2. 手机号正则校验（11位国内手机号）
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phoneReg.test(resetForm.value.phone)) {
    ElMessage.error('手机号格式不正确，请输入11位有效手机号')
    return
  }
  try {
    // 2. 请求后端
    const res = await axios.get('/user/sendSms', {
      params: { phone: resetForm.value.phone }
    })

    if (res.code === 200) {
      ElMessage.success('验证码已发送，查看控制台')

      // 倒计时
      resetCodeDisabled.value = true
      let time = 60
      resetCodeText.value = time + 's'
      const timer = setInterval(() => {
        time--
        resetCodeText.value = time + 's'
        if (time <= 0) {
          clearInterval(timer)
          resetCodeText.value = '获取验证码'
          resetCodeDisabled.value = false
        }
      }, 1000)
    } else {
      // 后端返回失败
      ElMessage.error(res.msg || '发送失败')
    }
  } catch (err) {
    // 网络错误 / 后端报异常
    ElMessage.error('发送失败：' + err.response?.data?.msg || '系统异常')
  }
}

// 登录
const handleLogin = async () => {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return;
    loginLoading.value = true;
    try {
      const res = await request.post('/user/login', loginForm.value);
      if (res.code == "200") {
        const username = loginForm.value.username; // 学号（唯一）
        const token = res.data.token;

        sessionStorage.setItem('token', token);
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('userInfo', JSON.stringify(res.data));

        ElMessage.success("欢迎回来，" + res.data.realName);
        router.push(res.data.role === 1 ? "/manager/dashboard" : "/front/home");
      }
    } catch (err) {
      ElMessage.error("登录失败");
    } finally {
      loginLoading.value = false;
    }
  });
};

// 注册
const handleRegister = async () => {
  registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    registerLoading.value = true
    try {
      const res = await axios.post('/user/register', registerForm.value)
      if (res.code === "200") {
        ElMessage.success('注册成功，请登录')
        activeTab.value = 'login'
        registerForm.value = { username: '', realName: '', password: '', confirmPassword: '', phone: '', college: '', role: 0 }
      } else {
        ElMessage.error(res.msg)
      }
    } catch (err) {
      ElMessage.error('注册失败')
    } finally {
      registerLoading.value = false
    }
  })
}

// 重置密码
const handleReset = async () => {
  resetFormRef.value.validate(async (valid) => {
    if (!valid) return
    resetLoading.value = true
    try {
      const res = await axios.post('/user/resetPassword', resetForm.value)
      if (res.code === 200) {
        ElMessage.success('密码重置成功，请登录')
        activeTab.value = 'login'
        resetForm.value = { username: '', phone: '', code: '', newPassword: '', confirmPassword: '' }
      } else {
        ElMessage.error(res.msg || '重置失败')
      }
    } catch (err) {
      ElMessage.error('重置失败')
    } finally {
      resetLoading.value = false
    }
  })
}
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}
.home-card {
  width: 450px;
  padding: 30px 20px;
}
h2 {
  text-align: center;
  margin-bottom: 25px;
}
.links {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
}
.links-center {
  text-align: center;
  margin-top: 12px;
  font-size: 14px;
}
.link {
  color: #409eff;
  cursor: pointer;
}
.link:hover {
  text-decoration: underline;
}
.code-row {
  display: flex;
  gap: 10px;
}
/* 让按钮和输入框对齐，不使用 deep */
.el-button--primary {
  width: 100% !important;
  margin-top: 5px !important;
}
</style>