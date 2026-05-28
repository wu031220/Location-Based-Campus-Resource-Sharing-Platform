import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import './assets/css/global.css'
import * as Icons from '@element-plus/icons-vue'


// 解决 ResizeObserver loop 报错
const debounce = (fn) => {
    let frame;
    return (...params) => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => fn(...params));
    };
};
const observer = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends observer {
    constructor(callback) {
        super(debounce(callback));
    }
};
const app = createApp(App)
Object.keys(Icons).forEach(key => {
    app.component(key, Icons[key])
})
app.use(ElementPlus, {
    locale: zhCn,
})
app.use(router)
app.mount('#app')
