import { createRouter, createWebHistory } from 'vue-router'

// 公开页面（无需登录）
import LoginPage from '../views/LoginPage.vue'

// 需要登录的页面
import TestPage from '../views/TestPage.vue'
import ManagerLayout from '../views/ManagerLayout.vue'
import FrontLayout from '../views/FrontLayout.vue'
import DashboardPage from "../views/manager/DashboardPage.vue";
import CampusResourcePage from "../views/manager/CampusResourcePage.vue"

const routes = [
    {
        path: '/',
        name: 'Home',
        component: LoginPage,
        meta: { requiresAuth: false, noLayout: true }
    },
    {
        path: '/test',
        name: 'Test',
        component: TestPage,
        meta: { requiresAuth: false, noLayout: true}
    },
    {
        path: '/manager',
        component: ManagerLayout,
        children: [
            { path: 'dashboard', component: DashboardPage },
            { path: 'category', component: () => import ('../views/manager/CategoryPage.vue')},
            { path: 'resource', component: CampusResourcePage },
            { path: 'user', component: () => import ('../views/manager/UserManagerPage.vue')},
            { path: 'transaction', component: () => import ('../views/manager/TransactionPage.vue')},
            { path: 'comment', component: () => import ('../views/manager/CommentManagerPage.vue')},
            { path: 'message', component: () => import ('../views/manager/MessageManagerPage.vue')},
            { path: 'userbehavior', component: () => import ('../views/manager/UserBehaviorManagerPage.vue')},
            { path: 'appealManage',  component: () => import('@/views/manager/AppealManagePage.vue'),},
            { path: 'setting',  component: () => import('@/views/manager/SettingManagePage.vue'),},
        ]
    },
    {
        path: '/front',
        component: FrontLayout,
        children: [
            { path: 'home', component: () => import ('../views/front/HomePage.vue')},
            { path: 'userhome', component: () => import ('../views/front/UserHome.vue')},
            { path: 'profile', component: () => import ('../views/front/ProfilePage.vue')},
            { path: 'publishresource', component: () => import ('../views/front/ResourcePublish.vue')},
            { path: 'resourceDetail', component: () => import ('../views/front/ResourceDetail.vue')},
            { path: 'transaction', component: () => import ('../views/front/TransactionList.vue')},
            { path: 'message', component: () => import ('../views/front/MessagePage.vue')},
            { path: 'sysmessage', component: () => import ('../views/front/SystemMessage.vue')},
            { path: 'history', component: () => import ('../views/front/TransactionHistory.vue')},
            { path: 'create', component: () => import ('../views/front/TransactionCreate.vue')},
            { path: 'transaction/pay', component: () => import ('../views/front/TransactionPay.vue')},
            { path: 'nav',component: () => import('@/views/front/NavPage.vue')},
        ]
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})
router.beforeEach((to, from, next) => {
    // 获取 token（登录状态）
    const token = localStorage.getItem('token')

    // 如果页面需要登录
    if (to.meta.requiresAuth) {
        if (token) {
            // 已登录 → 放行
            next()
        } else {
            // 未登录 → 跳登录页
            next('/')
        }
    } else {
        // 不需要登录的页面直接放行
        next()
    }
})

export default router