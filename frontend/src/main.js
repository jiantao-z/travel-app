import { createApp } from 'vue'
import './style.css'
import './assets/dark-theme.css'
import App from './App.vue'
import emitter, { currentLanguage, currentTheme } from './eventBus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import zhCn from "element-plus/es/locale/lang/zh-cn"
import 'element-plus/dist/index.css'

// 初始化应用设置
const initAppSettings = () => {
  const savedLanguage = localStorage.getItem('language')
  const savedTheme = localStorage.getItem('theme')
  
  if (savedLanguage) currentLanguage.value = savedLanguage
  if (savedTheme) {
    currentTheme.value = savedTheme
    document.body.className = savedTheme === 'dark' ? 'dark' : ''
  }
}

// 监听主题变更事件
emitter.on('theme-changed', (theme) => {
  currentTheme.value = theme
  document.body.className = theme === 'dark' ? 'dark' : ''
  localStorage.setItem('theme', theme)
})

// 在应用创建前初始化设置
initAppSettings()

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
     app.component(key, component)
 }

app.use(ElementPlus, { locale: zhCn })

//全局挂载事件总线
app.config.globalProperties.emitter = emitter

app.mount('#app')
