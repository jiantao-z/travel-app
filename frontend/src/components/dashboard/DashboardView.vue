<template>
    <div class="screen-container">
        <!-- ═══════════ 顶栏 ═══════════ -->
        <header class="top-bar">
            <div class="top-left">
                <button class="back-btn" @click="goBack">← BACK</button>
                <h1 class="page-title">旅行<br />洞察</h1>
            </div>
            <div class="top-right">
                <div class="year-tag" @click="cycleYear">{{ selectedYear }} ▼</div>
                <div class="seasonal-dot"></div>
                <span class="seasonal-label">夏季出行高峰</span>
            </div>
        </header>

        <!-- ═══════════ KPI 色块带 ═══════════ -->
        <section class="kpi-strip" ref="kpiStripRef">
            <div v-for="(kpi, i) in kpiData" :key="kpi.label" class="kpi-block" :class="[`kpi-block--${kpi.colorKey}`]"
                @mouseenter="bumpKpi = i" @mouseleave="bumpKpi = null">
                <span class="kpi-number" :class="{ 'kpi-bump': bumpKpi === i }">
                    {{ kpi.animated.toLocaleString() }}
                </span>
                <span class="kpi-label">{{ kpi.label }}</span>
                <div class="kpi-bar">
                    <div class="kpi-bar-fill" :style="{ width: kpi.barPct + '%' }"></div>
                </div>
            </div>
        </section>

        <!-- ═══════════ 地图 + 地区介绍 ═══════════ -->
        <section class="region-explore" ref="regionExploreRef">
            <div class="region-header">
                <h2 class="section-title">EXPLORE · 探索地区</h2>
                <div class="region-nav">
                    <button v-for="(r, i) in regionData" :key="r.name" class="region-dot"
                        :class="{ 'region-dot--active': currentRegion === i }" @click="switchRegion(i)">
                        <span class="region-dot-line"></span>
                    </button>
                </div>
            </div>

            <div class="region-body">
                <!-- 左侧：地区卡片 -->
                <div class="region-card" @mouseenter="pauseAutoPlay" @mouseleave="resumeAutoPlay">
                    <div class="region-photos">
                        <div v-for="(img, idx) in currentRegionData.images" :key="idx" class="region-photo"
                            :class="`region-photo--${idx}`">
                            <img :src="img" :alt="currentRegionData.name" loading="lazy" />
                        </div>
                    </div>
                    <div class="region-info">
                        <div class="region-tag">{{ String(currentRegion + 1).padStart(2, '0') }} / {{ regionData.length
                        }}</div>
                        <h3 class="region-name">{{ currentRegionData.name }}</h3>
                        <p class="region-desc">{{ currentRegionData.desc }}</p>
                        <div class="region-cities">
                            <span v-for="city in currentRegionData.cities" :key="city" class="city-chip">{{ city
                            }}</span>
                        </div>
                    </div>
                </div>

                <!-- 右侧：地图 -->
                <div class="region-map-wrap">
                    <div class="map-label">{{ currentRegionData.name }} · 热门城市分布</div>
                    <div ref="regionMapRef" class="region-map-box"></div>
                </div>
            </div>
        </section>

        <!-- ═══════════ 三栏数据 ═══════════ -->
        <section class="three-col" ref="threeColRef">
            <!-- 目的地排行 -->
            <div class="col-block">
                <h2 class="block-heading">HOT DESTINATIONS</h2>
                <div class="bold-divider"></div>
                <div class="bar-stack">
                    <div v-for="(city, i) in animatedDestinations" :key="city.name" class="bar-row"
                        @mouseenter="hoverBar = i" @mouseleave="hoverBar = null"
                        :class="{ 'bar-row--hover': hoverBar === i }">
                        <span class="bar-rank">{{ String(i + 1).padStart(2, '0') }}</span>
                        <span class="bar-label">{{ city.name }}</span>
                        <span class="bar-figure">{{ city.formatted }}k</span>
                        <div class="bar-track">
                            <div class="bar-gauge"
                                :style="{ width: city.percent + '%', background: barColors[i % barColors.length] }">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 预算分配 -->
            <div class="col-block">
                <h2 class="block-heading">BUDGET</h2>
                <div class="bold-divider"></div>
                <div class="budget-grid">
                    <div v-for="b in budgetData" :key="b.name" class="budget-cell" @mouseenter="hoverBudget = b.name"
                        @mouseleave="hoverBudget = null">
                        <div class="budget-ring" :class="{ 'budget-ring--active': hoverBudget === b.name }"
                            :style="{ borderColor: b.color, borderWidth: (hoverBudget === b.name ? 5 : 3) + 'px' }">
                            <span class="budget-pct">{{ b.value }}%</span>
                        </div>
                        <span class="budget-name">{{ b.name }}</span>
                    </div>
                </div>
            </div>

            <!-- 出行时长 + 标签 -->
            <div class="col-block">
                <h2 class="block-heading">DURATION · 出行时长</h2>
                <div class="bold-divider"></div>
                <div ref="pieChartRef" class="chart-box"></div>
            </div>
        </section>

        <!-- ═══════════ 人气景点 Top 10 ═══════════ -->
        <section class="attractions-section" ref="attSectionRef">
            <h2 class="section-title">TOP 10 · 人气景点</h2>
            <div class="bold-divider bold-divider--wide"></div>
            <div class="att-grid">
                <div v-for="(spot, i) in animatedAttractions" :key="spot.name" class="att-card"
                    :class="{ 'att-card--visible': attVisible[i] }" :style="{ transitionDelay: (i * 0.06) + 's' }">
                    <span class="att-card-rank">{{ String(i + 1).padStart(2, '0') }}</span>
                    <img :src="spot.image" :alt="spot.name" class="att-card-img" loading="lazy" />
                    <div class="att-card-body">
                        <span class="att-card-name">{{ spot.name }}</span>
                        <span class="att-card-value">{{ spot.formatted }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══════════ 标签云 ═══════════ -->
        <section class="tags-section" ref="tagsSectionRef">
            <h2 class="section-title">热门旅行标签</h2>
            <div class="bold-divider bold-divider--wide"></div>
            <div class="tag-cloud">
                <span v-for="(tag, ti) in animatedTags" :key="tag.text" class="tag-brick"
                    :class="{ 'tag-brick--active': hoverTag === ti, 'tag-brick--revealed': tag.revealed }"
                    :style="{ '--tag-color': tag.color, fontSize: tag.size + 'px', transitionDelay: (ti * 0.04) + 's' }"
                    @mouseenter="hoverTag = ti" @mouseleave="hoverTag = null">
                    {{ tag.text }}
                </span>
            </div>
        </section>

        <!-- ═══════════ 底部景点推荐 ═══════════ -->
        <section class="spotlight-section" ref="spotlightRef">
            <h2 class="section-title">EXPLORE · 探索推荐</h2>
            <div class="bold-divider bold-divider--wide"></div>

            <!-- Hero 大图 -->
            <div class="spot-hero" @mouseenter="spotHoverIdx = 0" @mouseleave="spotHoverIdx = null">
                <img :src="spotHero.image" :alt="spotHero.name" class="spot-hero-img" />
                <div class="spot-hero-overlay">
                    <span class="spot-hero-tag">{{ spotHero.tag }}</span>
                    <h3 class="spot-hero-title">{{ spotHero.name }}</h3>
                    <p class="spot-hero-desc">{{ spotHero.desc }}</p>
                </div>
            </div>

            <!-- 三列网格 -->
            <div class="spot-grid-3">
                <div v-for="(spot, i) in spotGrid3" :key="spot.name" class="spot-card"
                    @mouseenter="spotHoverIdx = i + 1" @mouseleave="spotHoverIdx = null">
                    <div class="spot-card-img-wrap">
                        <img :src="spot.image" :alt="spot.name" class="spot-card-img" loading="lazy" />
                    </div>
                    <div class="spot-card-overlay">
                        <span class="spot-card-tag">{{ spot.tag }}</span>
                        <span class="spot-card-title">{{ spot.name }}</span>
                    </div>
                </div>
            </div>

            <!-- 非对称双栏 1 -->
            <div class="spot-split">
                <div class="spot-split-cell spot-split--tall" @mouseenter="spotHoverIdx = 4"
                    @mouseleave="spotHoverIdx = null">
                    <div class="spot-card-img-wrap">
                        <img :src="spotSplit1[0].image" :alt="spotSplit1[0].name" class="spot-card-img"
                            loading="lazy" />
                    </div>
                    <div class="spot-card-overlay">
                        <span class="spot-card-tag">{{ spotSplit1[0].tag }}</span>
                        <span class="spot-card-title">{{ spotSplit1[0].name }}</span>
                    </div>
                </div>
                <div class="spot-split-cell spot-split--wide" @mouseenter="spotHoverIdx = 5"
                    @mouseleave="spotHoverIdx = null">
                    <div class="spot-card-img-wrap">
                        <img :src="spotSplit1[1].image" :alt="spotSplit1[1].name" class="spot-card-img"
                            loading="lazy" />
                    </div>
                    <div class="spot-card-overlay">
                        <span class="spot-card-tag">{{ spotSplit1[1].tag }}</span>
                        <span class="spot-card-title">{{ spotSplit1[1].name }}</span>
                    </div>
                </div>
            </div>

            <!-- 非对称双栏 2 (反向) -->
            <div class="spot-split">
                <div class="spot-split-cell spot-split--wide" @mouseenter="spotHoverIdx = 6"
                    @mouseleave="spotHoverIdx = null">
                    <div class="spot-card-img-wrap">
                        <img :src="spotSplit2[0].image" :alt="spotSplit2[0].name" class="spot-card-img"
                            loading="lazy" />
                    </div>
                    <div class="spot-card-overlay">
                        <span class="spot-card-tag">{{ spotSplit2[0].tag }}</span>
                        <span class="spot-card-title">{{ spotSplit2[0].name }}</span>
                    </div>
                </div>
                <div class="spot-split-cell spot-split--tall" @mouseenter="spotHoverIdx = 7"
                    @mouseleave="spotHoverIdx = null">
                    <div class="spot-card-img-wrap">
                        <img :src="spotSplit2[1].image" :alt="spotSplit2[1].name" class="spot-card-img"
                            loading="lazy" />
                    </div>
                    <div class="spot-card-overlay">
                        <span class="spot-card-tag">{{ spotSplit2[1].tag }}</span>
                        <span class="spot-card-title">{{ spotSplit2[1].name }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- 底部署名 -->
        <footer class="page-footer">
            <div class="footer-line"></div>
            <span>TRAVEL INSIGHT · 2026</span>
        </footer>
    </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, reactive, computed } from 'vue'
import * as echarts from 'echarts'
import emitter from '@/eventBus'

// ── 景点图片 ──
import spotImg1 from '@/assets/景点/景点 (1).jpg'
import spotImg2 from '@/assets/景点/景点 (2).jpg'
import spotImg3 from '@/assets/景点/景点 (3).jpg'
import spotImg4 from '@/assets/景点/景点 (4).jpg'
import spotImg5 from '@/assets/景点/景点 (5).jpg'
import spotImg6 from '@/assets/景点/景点 (6).jpg'
import spotImg7 from '@/assets/景点/景点 (7).jpg'
import spotImg8 from '@/assets/景点/景点 (8).jpg'
import spotImg9 from '@/assets/景点/景点 (9).jpg'

// ── Refs ──
const regionMapRef = ref(null)
const pieChartRef = ref(null)
const kpiStripRef = ref(null)
const threeColRef = ref(null)
const attSectionRef = ref(null)
const tagsSectionRef = ref(null)
const spotlightRef = ref(null)

let regionMapChart = null
let pieChart = null
let observer = null
let autoPlayTimer = null

// ── 交互状态 ──
const bumpKpi = ref(null)
const hoverBar = ref(null)
const hoverTag = ref(null)
const hoverBudget = ref(null)
const spotHoverIdx = ref(null)
const selectedYear = ref('2026')
const currentRegion = ref(0)

const barColors = ['#c45b3d', '#d4a44a', '#3d8b7e', '#5b8c6f', '#2d5f8b', '#d4726a']

// ── KPI 数据 ──
const kpiData = reactive([
    { label: '目的地收藏', target: 18246, animated: 0, barPct: 0, colorKey: 'terracotta' },
    { label: '计划已生成', target: 12543, animated: 0, barPct: 0, colorKey: 'mustard' },
    { label: '活跃规划用户', target: 852, animated: 0, barPct: 0, colorKey: 'teal' }
])

// ── 目的地 ──
const rawDestinations = [
    { name: '北京', value: 10200 }, { name: '上海', value: 9600 }, { name: '成都', value: 9200 },
    { name: '重庆', value: 8800 }, { name: '西安', value: 8400 }, { name: '杭州', value: 7800 }
]
const maxDest = 10200
const animatedDestinations = reactive(rawDestinations.map(d => ({
    ...d, formatted: (d.value / 1000).toFixed(1), percent: 0
})))

// ── 景点 ──
const rawAttractions = [
    { name: '开封万岁山武侠城', value: '9,850', sortVal: 9850, image: spotImg3 },
    { name: '西安大唐不夜城', value: '9,320', sortVal: 9320, image: spotImg8 },
    { name: '长沙五一广场', value: '8,760', sortVal: 8760, image: spotImg9 },
    { name: '哈尔滨中央大街', value: '8,120', sortVal: 8120, image: spotImg6 },
    { name: '洛阳 清明上河园', value: '7,680', sortVal: 7680, image: spotImg5 },
    { name: '北京 环球度假区', value: '7,210', sortVal: 7210, image: spotImg7 },
    { name: '上海迪士尼', value: '6,850', sortVal: 6850, image: 'https://images.unsplash.com/photo-1590144662036-33bf0ebd2c7f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fCVFOCVCRiVBQSVFNSVBMyVBQiVFNSVCMCVCQyVFNCVCOCU4QSVFNiVCNSVCN3xlbnwwfHwwfHx8MA%3D%3D' },
    { name: '河南宝泉旅游区', value: '6,390', sortVal: 6390, image: spotImg4 },
    { name: '南京牛首山', value: '5,910', sortVal: 5910, image: spotImg1 },
    { name: '重庆动物园', value: '5,540', sortVal: 5540, image: spotImg2 }
]
const maxAtt = 9850
const animatedAttractions = reactive(rawAttractions.map(a => ({
    ...a, formatted: a.value, percent: 0
})))
const attVisible = reactive(rawAttractions.map(() => false))

// ── 预算 ──
const budgetData = [
    { name: '住宿', value: 40, color: '#c45b3d' },
    { name: '交通', value: 28, color: '#d4a44a' },
    { name: '餐饮', value: 22, color: '#3d8b7e' },
    { name: '门票', value: 10, color: '#5b8c6f' }
]

// ── 标签 ──
const rawTags = [
    { text: '特种兵旅游', size: 18, color: '#c45b3d' }, { text: 'City Walk', size: 17, color: '#5b8c6f' },
    { text: '免税店', size: 14, color: '#d4a44a' }, { text: '苏超', size: 15, color: '#3d8b7e' },
    { text: '海岛度假', size: 16, color: '#2d5f8b' }, { text: '古镇打卡', size: 13, color: '#d4726a' },
    { text: '美食之旅', size: 17, color: '#c45b3d' }, { text: '自驾游', size: 12, color: '#d4a44a' },
    { text: '博物馆', size: 12, color: '#5b8c6f' }, { text: '滑雪', size: 11, color: '#2d5f8b' },
    { text: '温泉', size: 11, color: '#d4726a' }, { text: '骑行路线', size: 10, color: '#3d8b7e' },
    { text: '演唱会游', size: 10, color: '#c45b3d' }, { text: '夜市小吃', size: 14, color: '#d4a44a' },
    { text: '赏花季', size: 11, color: '#5b8c6f' }, { text: '亲子乐园', size: 12, color: '#2d5f8b' },
    { text: '极光追猎', size: 9, color: '#d4726a' }, { text: '漂流探险', size: 9, color: '#3d8b7e' }
]
const animatedTags = reactive(rawTags.map(t => ({ ...t, revealed: false })))

// ── 景点推荐数据 ──
const spotHero = {
    name: '北京 · 故宫博物院', tag: 'MUST VISIT',
    desc: '世界最大的宫殿建筑群，六百年皇家记忆。穿越中轴线，感受明清帝王之家的恢弘气势。',
    image: 'https://images.unsplash.com/photo-1591067457498-5013f5afe0cc?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
}
const spotGrid3 = [
    { name: '西湖 · 杭州', tag: 'NATURE', image: 'https://images.unsplash.com/photo-1725879642445-854e1dd30185?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8JUU4JUE1JUJGJUU2JUI5JTk2fGVufDB8fDB8fHww' },
    { name: '九寨沟 · 四川', tag: 'WONDER', image: 'https://images.unsplash.com/photo-1635772512104-98695c3a73f1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8JUU0JUI5JTlEJUU1JUFGJUE4JUU2JUIyJTlGfGVufDB8fDB8fHww' },
    { name: '迪士尼 · 上海', tag: 'FUN', image: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=500&h=350&fit=crop' }
]
const spotSplit1 = [
    { name: '丽江古城', tag: 'CULTURE', image: 'https://images.unsplash.com/photo-1698562671605-1699bcc9ae85?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGlqaWFuZ3xlbnwwfHwwfHx8MA%3D%3D' },
    { name: '成都 · 火锅盛宴', tag: 'FOOD', image: 'https://images.unsplash.com/photo-1611345157614-26d3bdd10c93?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fCVFOSVCQSVCQiVFOCVCRSVBMyVFNyU4MSVBQiVFOSU5NCU4NXxlbnwwfHwwfHx8MA%3D%3D' }
]
const spotSplit2 = [
    { name: '张家界 · 阿凡达世界', tag: 'ADVENTURE', image: 'https://plus.unsplash.com/premium_photo-1661962946869-4cf54aa4c778?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { name: '兵马俑 · 西安', tag: 'HISTORY', image: 'https://images.unsplash.com/photo-1527922891260-918d42a4efc8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGVycmFjb3R0YSUyMGFybXl8ZW58MHx8MHx8fDA%3D' }
]

// ── 世界地图数据 ──
const provinceHeatData = [
    { name: '广东省', value: 980 }, { name: '浙江省', value: 950 }, { name: '四川省', value: 920 },
    { name: '江苏省', value: 890 }, { name: '云南省', value: 860 }, { name: '北京市', value: 830 },
    { name: '山东省', value: 790 }, { name: '上海市', value: 760 }, { name: '福建省', value: 710 },
    { name: '湖南省', value: 660 }, { name: '湖北省', value: 630 }, { name: '陕西省', value: 600 },
    { name: '河南省', value: 570 }, { name: '海南省', value: 540 }, { name: '重庆市', value: 510 },
    { name: '广西壮族自治区', value: 480 }, { name: '贵州省', value: 450 }, { name: '安徽省', value: 420 },
    { name: '河北省', value: 390 }, { name: '江西省', value: 360 }, { name: '辽宁省', value: 330 },
    { name: '山西省', value: 300 }, { name: '天津市', value: 270 }, { name: '吉林省', value: 250 },
    { name: '内蒙古自治区', value: 230 }, { name: '黑龙江省', value: 210 }, { name: '甘肃省', value: 190 },
    { name: '新疆维吾尔自治区', value: 170 }, { name: '西藏自治区', value: 150 }, { name: '宁夏回族自治区', value: 130 },
    { name: '青海省', value: 110 }, { name: '香港特别行政区', value: 90 }, { name: '台湾省', value: 70 }, { name: '澳门特别行政区', value: 50 }
]

const cityCoordMap = {
    北京: [116.4, 39.9], 上海: [121.47, 31.23], 广州: [113.28, 23.13],
    深圳: [114.06, 22.54], 成都: [104.07, 30.66], 西安: [108.95, 34.26],
    重庆: [106.50, 29.53], 杭州: [120.15, 30.29], 南京: [118.80, 32.06],
    三亚: [109.51, 18.25], 昆明: [102.71, 25.04], 厦门: [118.11, 24.49],
    武汉: [114.30, 30.58], 长沙: [112.98, 28.19], 哈尔滨: [126.64, 45.76],
    拉萨: [91.13, 29.66], 苏州: [120.59, 31.30], 青岛: [120.38, 36.07]
}

const lineFlowsPrimary = [
    [{ name: '北京' }, { name: '上海', value: 98 }], [{ name: '北京' }, { name: '成都', value: 92 }],
    [{ name: '广州' }, { name: '北京', value: 84 }], [{ name: '深圳' }, { name: '上海', value: 80 }],
    [{ name: '上海' }, { name: '西安', value: 86 }], [{ name: '成都' }, { name: '广州', value: 76 }]
]
const lineFlowsSecondary = [
    [{ name: '上海' }, { name: '成都', value: 72 }], [{ name: '北京' }, { name: '重庆', value: 68 }],
    [{ name: '广州' }, { name: '西安', value: 64 }], [{ name: '深圳' }, { name: '成都', value: 60 }],
    [{ name: '上海' }, { name: '重庆', value: 56 }], [{ name: '北京' }, { name: '广州', value: 52 }]
]

const resparkCities = [
    { name: '重庆', value: 310 }, { name: '成都', value: 290 }, { name: '西安', value: 260 },
    { name: '厦门', value: 230 }, { name: '杭州', value: 210 }, { name: '长沙', value: 190 },
    { name: '武汉', value: 170 }, { name: '三亚', value: 155 }
]

const convertLine = (data) => data.map(item => {
    const fc = cityCoordMap[item[0].name], tc = cityCoordMap[item[1].name]
    return fc && tc ? { fromName: item[0].name, toName: item[1].name, coords: [fc, tc], value: item[1].value } : null
}).filter(Boolean)

// ── 地区数据 ──
const regionData = [
    {
        name: '华北 · 京城风韵', desc: '千年帝都，长城内外。从紫禁城到胡同巷弄，从烤鸭到涮羊肉，华北大地承载着中华文明的厚重底色。',
        cities: ['北京', '天津', '青岛', '哈尔滨'],
        coords: [[116.4, 39.9], [117.2, 39.1], [120.38, 36.07], [126.64, 45.76]],
        images: [
            'https://images.unsplash.com/photo-1611238417515-35da8a4af4ca?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fCVFNSU4QyU5NyVFNCVCQSVBQ3xlbnwwfHwwfHx8MA%3D%3D',
            'https://plus.unsplash.com/premium_photo-1691960159059-04976913256a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fCVFNSVBNCVBOSVFNiVCNCVBNXxlbnwwfHwwfHx8MA%3D%3D',
            'https://images.unsplash.com/photo-1656650283561-4182f9d301af?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8JUU5JTlEJTkyJUU1JUIyJTlCfGVufDB8fDB8fHww',
            'https://images.unsplash.com/photo-1657441105458-7a632d2ccbfd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8JUU1JTkzJTg4JUU1JUIwJTk0JUU2JUJCJUE4fGVufDB8fDB8fHww'
        ]
    },
    {
        name: '华东 · 水墨江南', desc: '西湖烟雨，外滩霓虹。从古典园林到现代都市，从龙井茶香到生煎馒头，华东是水乡与摩登的完美交融。',
        cities: ['上海', '杭州', '南京', '苏州'],
        coords: [[121.47, 31.23], [120.15, 30.29], [118.80, 32.06], [120.59, 31.30]],
        images: [
            'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8JUU0JUI4JThBJUU2JUI1JUI3fGVufDB8fDB8fHww',
            'https://images.unsplash.com/photo-1725879642445-854e1dd30185?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8JUU2JTlEJUFEJUU1JUI3JTlFfGVufDB8fDB8fHww',
            'https://images.unsplash.com/photo-1627208970976-f7fc03ab0eb1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fG5hbmppbmd8ZW58MHx8MHx8fDA%3D',
            'https://images.unsplash.com/photo-1689827524021-7d99d37c55c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3V6aG91fGVufDB8fDB8fHww'
        ]
    },
    {
        name: '西南 · 秘境奇观', desc: '蜀道翠微，滇池云影。从成都火锅到丽江古城，从九寨沟碧水到峨眉金顶，西南是自然与人文的宝库。',
        cities: ['成都', '重庆', '昆明', '拉萨'],
        coords: [[104.07, 30.66], [106.50, 29.53], [102.71, 25.04], [91.13, 29.66]],
        images: [
            'https://images.unsplash.com/photo-1611345157614-26d3bdd10c93?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aG90cG90fGVufDB8fDB8fHww',
            'https://images.unsplash.com/photo-1627727240288-71c6b9ae5ee6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2hvbmdxaW5nfGVufDB8fDB8fHww',
            'https://images.unsplash.com/photo-1503641926155-5c17619b79d0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dGliZXR8ZW58MHx8MHx8fDA%3D',
            'https://images.unsplash.com/photo-1559551408-ec5a31a4aaab?w=600&h=200&fit=crop'
        ]
    },
    {
        name: '华南 · 椰风海韵', desc: '珠江潮涌，天涯碧海。从广州早茶到三亚沙滩，从鼓浪屿琴声到深圳科技，华南是活力与悠闲并存的南国。',
        cities: ['广州', '深圳', '厦门', '三亚'],
        coords: [[113.28, 23.13], [114.06, 22.54], [118.11, 24.49], [109.51, 18.25]],
        images: [
            'https://images.unsplash.com/photo-1636259584602-5a3c9c0d05ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGd1YW5nemhvdXxlbnwwfHwwfHx8MA%3D%3D',
            'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1623299818121-49e74f10458f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8JUU0JUI4JTg5JUU0JUJBJTlBfGVufDB8fDB8fHwwhttps://images.unsplash.com/photo-1565967511849-76a60a516170?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1526711657229-e7e080ed7aa1?w=600&h=200&fit=crop'
        ]
    },
    {
        name: '华中 · 荆楚大地', desc: '长江中游，九省通衢。从武汉热干面到长沙臭豆腐，从张家界奇峰到岳麓书院，华中是江湖与诗意的黄金十字。',
        cities: ['武汉', '长沙', '西安'],
        coords: [[114.30, 30.58], [112.98, 28.19], [108.95, 34.26]],
        images: [
            'https://images.unsplash.com/photo-1527922891260-918d42a4efc8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8eGlhbnxlbnwwfHwwfHx8MA%3D%3Dhttps://images.unsplash.com/photo-1565967511849-76a60a516170?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1634622590052-0bb1039f79a4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8d3VoYW58ZW58MHx8MHx8fDA%3D',
            'https://images.unsplash.com/photo-1635685296916-95acaf58471f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fCVFNyU4MyVBRCVFNSVCOSVCMiVFOSU5RCVBMnxlbnwwfHwwfHx8MA%3D%3D'
        ]
    }
]
const currentRegionData = computed(() => regionData[currentRegion.value])

const switchRegion = (idx) => {
    currentRegion.value = idx
    highlightRegionOnMap(idx)
    resetAutoPlay()
}

const pauseAutoPlay = () => { if (autoPlayTimer) clearInterval(autoPlayTimer) }
const resumeAutoPlay = () => { resetAutoPlay() }
const resetAutoPlay = () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer)
    autoPlayTimer = setInterval(() => {
        currentRegion.value = (currentRegion.value + 1) % regionData.length
        highlightRegionOnMap(currentRegion.value)
    }, 6000)
}

const highlightRegionOnMap = (idx) => {
    if (!regionMapChart) return
    const region = regionData[idx]
    const regionCities = region.coords
    // 更新 effectScatter 数据，只显示当前地区城市
    regionMapChart.setOption({
        series: [
            {}, // map layer - keep
            {}, // primary lines - keep
            {}, // secondary lines - keep
            {
                // effectScatter - update with region cities
                data: regionCities.map((coord, i) => ({
                    name: region.cities[i],
                    value: [...coord, 300 + i * 10]
                }))
            }
        ]
    })
}

// ── 方法 ──
const goBack = () => emitter.emit('toggle-dashboard')
const cycleYear = () => {
    const years = ['2024', '2025', '2026']
    const idx = years.indexOf(selectedYear.value)
    selectedYear.value = years[(idx + 1) % years.length]
}

// ── IntersectionObserver 动效 ──
const setupObserver = () => {
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target
                if (el === attSectionRef.value) {
                    attVisible.forEach((_, i) => {
                        setTimeout(() => { attVisible[i] = true }, i * 80)
                    })
                }
                if (el === tagsSectionRef.value) {
                    animatedTags.forEach((t, i) => {
                        setTimeout(() => { t.revealed = true }, i * 45)
                    })
                }
            }
        })
    }, { threshold: 0.2 })

    if (attSectionRef.value) observer.observe(attSectionRef.value)
    if (tagsSectionRef.value) observer.observe(tagsSectionRef.value)
}

// ── 柱状图渐进动效 ──
const animateBars = () => {
    const steps = 50
    let frame = 0
    const tick = () => {
        frame++; const p = Math.min(1, frame / steps); const e = 1 - Math.pow(1 - p, 3)
        animatedDestinations.forEach(d => { d.percent = Math.round((d.value / maxDest * 100) * e * 10) / 10 })
        animatedAttractions.forEach(a => { a.percent = Math.round((a.sortVal / maxAtt * 100) * e * 10) / 10 })
        kpiData[0].animated = Math.round(18246 * e); kpiData[0].barPct = Math.round(87 * e)
        kpiData[1].animated = Math.round(12543 * e); kpiData[1].barPct = Math.round(72 * e)
        kpiData[2].animated = Math.round(852 * e); kpiData[2].barPct = Math.round(53 * e)
        if (frame < steps) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
}

// ── 地图（联动地区选择 + 飞线 + 呼吸点） ──
const initRegionMap = async () => {
    if (!regionMapRef.value) return
    for (let i = 0; i < 20; i++) {
        if (regionMapRef.value.clientWidth > 0 && regionMapRef.value.clientHeight > 0) break
        await new Promise(r => requestAnimationFrame(r))
    }
    regionMapChart = echarts.init(regionMapRef.value)
    try {
        const resp = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
        echarts.registerMap('travel-china', await resp.json())
        const primaryLines = convertLine(lineFlowsPrimary)
        const secondaryLines = convertLine(lineFlowsSecondary)
        const initialRegion = regionData[0]

        regionMapChart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item', backgroundColor: '#fff', borderColor: '#1a1a1a', borderWidth: 2,
                textStyle: { color: '#1a1a1a', fontSize: 12, fontFamily: 'Noto Sans SC' },
                formatter: (p) => {
                    if (p.seriesType === 'lines') return `<b>${p.data.fromName}</b> → <b>${p.data.toName}</b><br/>热度 ${p.data.value}`
                    if (p.seriesType === 'effectScatter') return `<b>${p.name}</b><br/>地区活跃度 ${p.value[2]}`
                    return `<b>${p.name || ''}</b><br/>热度 ${p.value || 0}`
                }
            },
            visualMap: {
                min: 0, max: 1000, left: 12, bottom: 12, text: ['HIGH', 'LOW'],
                textStyle: { color: '#5c5c5c', fontSize: 9, fontFamily: 'Noto Sans SC', fontWeight: 700 },
                calculable: true, itemWidth: 8, itemHeight: 70, orient: 'vertical',
                inRange: { color: ['#f6f4f1', '#e8d5c4', '#d4a88c', '#c45b3d', '#8b3a2a'] }
            },
            geo: {
                map: 'travel-china', roam: true, zoom: 1.05, layoutCenter: ['50%', '52%'], layoutSize: '96%',
                label: { show: false },
                itemStyle: { areaColor: '#edeae5', borderColor: '#ffffff', borderWidth: 1 },
                emphasis: {
                    itemStyle: { areaColor: '#d4c8b8', borderColor: '#8b7b6b', borderWidth: 2 },
                    label: { show: true, color: '#1a1a1a', fontSize: 10, fontFamily: 'Noto Sans SC', fontWeight: 700 }
                }
            },
            series: [
                {
                    name: '目的地热度', type: 'map', map: 'travel-china', geoIndex: 0, roam: false,
                    data: provinceHeatData, label: { show: false },
                    emphasis: { label: { show: true, color: '#1a1a1a' }, itemStyle: { areaColor: '#c4b0a0' } }
                },
                {
                    name: '热门航线', type: 'lines', coordinateSystem: 'geo', zlevel: 2, polyline: false,
                    effect: { show: true, period: 4, trailLength: 0.35, symbol: 'arrow', symbolSize: 7, color: '#c45b3d' },
                    lineStyle: { color: '#c45b3d', width: 1.6, opacity: 0.55, curveness: 0.25 }, data: primaryLines
                },
                {
                    name: '新兴航线', type: 'lines', coordinateSystem: 'geo', zlevel: 2, polyline: false,
                    effect: { show: true, period: 5.5, trailLength: 0.28, symbol: 'circle', symbolSize: 5, color: '#2d5f8b' },
                    lineStyle: { color: '#2d5f8b', width: 1.2, opacity: 0.45, curveness: -0.3 }, data: secondaryLines
                },
                {
                    name: '地区城市', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 3,
                    rippleEffect: { brushType: 'stroke', scale: 4, period: 3.5 },
                    symbol: 'circle', symbolSize: 12,
                    itemStyle: { color: '#c45b3d', shadowBlur: 14, shadowColor: 'rgba(196,91,61,0.5)' },
                    data: initialRegion.coords.map((coord, i) => ({
                        name: initialRegion.cities[i],
                        value: [...coord, 300 + i * 15]
                    }))
                }
            ]
        })
        window.addEventListener('resize', () => { regionMapChart?.resize(); pieChart?.resize() })
        resetAutoPlay()
    } catch (e) { console.error('Map init failed:', e) }
}

// ── 环形图 ──
const initPie = async () => {
    if (!pieChartRef.value) return
    for (let i = 0; i < 20; i++) {
        if (pieChartRef.value.clientWidth > 0 && pieChartRef.value.clientHeight > 0) break
        await new Promise(r => requestAnimationFrame(r))
    }
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
        tooltip: { trigger: 'item', backgroundColor: '#fff', borderColor: '#1a1a1a', borderWidth: 2, textStyle: { color: '#1a1a1a', fontSize: 11 } },
        color: ['#c45b3d', '#d4a44a', '#5b8c6f', '#3d8b7e'],
        series: [{
            type: 'pie', radius: ['40%', '66%'], center: ['50%', '50%'],
            itemStyle: { borderColor: '#f4f1ec', borderWidth: 3 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold', color: '#1a1a1a' }, scaleSize: 5 },
            data: [{ value: 45, name: '周末游' }, { value: 35, name: '小长假' }, { value: 15, name: '深度游' }, { value: 5, name: '一日游' }],
            animationType: 'scale', animationEasing: 'elasticOut', animationDelay: idx => idx * 200
        }]
    })
}

onMounted(async () => {
    await nextTick()
    animateBars()
    setupObserver()
    initRegionMap()
    initPie()
})

onBeforeUnmount(() => {
    if (autoPlayTimer) clearInterval(autoPlayTimer)
    window.removeEventListener('resize', () => { regionMapChart?.resize(); pieChart?.resize() })
    observer?.disconnect()
    regionMapChart?.dispose()
    pieChart?.dispose()
})
</script>

<style scoped>
/* ═══════════════════════════════════════════
   BAUSHAUS × BRUTALIST · YOUNG & BOLD
   MOTION_INTENSITY: 4
   ═══════════════════════════════════════════ */

.screen-container {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    width: 100vw;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    background: #f4f1ec;
    font-family: 'Noto Sans SC', system-ui, -apple-system, sans-serif;
    padding-bottom: 60px;
    -webkit-overflow-scrolling: touch;
}

/* ═══ 顶栏 ═══ */
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 24px 0;
    margin-bottom: 16px;
}

.top-left {
    display: flex;
    align-items: flex-start;
    gap: 22px;
}

.back-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: #1a1a1a;
    color: #f4f1ec;
    border: none;
    padding: 7px 16px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    transition: background 0.15s;
}

.back-btn:hover {
    background: #c45b3d;
}

.page-title {
    font-size: 34px;
    font-weight: 900;
    color: #1a1a1a;
    margin: 0;
    line-height: 1;
    letter-spacing: -1px;
}

.top-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.year-tag {
    font-size: 11px;
    font-weight: 700;
    color: #1a1a1a;
    border: 2px solid #1a1a1a;
    padding: 5px 14px;
    cursor: pointer;
    letter-spacing: 1.5px;
    transition: background 0.12s, color 0.12s;
}

.year-tag:hover {
    background: #1a1a1a;
    color: #f4f1ec;
}

.seasonal-dot {
    width: 8px;
    height: 8px;
    background: #d4a44a;
    animation: dotPulse 2s ease-in-out infinite;
}

@keyframes dotPulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.6;
    }

    50% {
        transform: scale(1.6);
        opacity: 1;
    }
}

.seasonal-label {
    font-size: 10px;
    font-weight: 600;
    color: #5c5c5c;
    letter-spacing: 1.5px;
}

/* ═══ KPI ═══ */
.kpi-strip {
    display: flex;
    gap: 3px;
    padding: 0 24px;
    margin-bottom: 24px;
}

.kpi-block {
    flex: 1;
    padding: 18px 24px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: filter 0.2s;
}

.kpi-block:hover {
    filter: brightness(1.06);
}

.kpi-block--terracotta {
    background: #c45b3d;
}

.kpi-block--mustard {
    background: #d4a44a;
}

.kpi-block--teal {
    background: #3d8b7e;
}

.kpi-number {
    font-size: 32px;
    font-weight: 900;
    color: #fff;
    font-family: var(--font-mono);
    letter-spacing: -1px;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.kpi-bump {
    animation: numBump 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes numBump {
    0% {
        transform: scale(1);
    }

    35% {
        transform: scale(1.14);
    }

    100% {
        transform: scale(1);
    }
}

.kpi-label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 4px;
    display: block;
}

.kpi-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.18);
    margin-top: 10px;
}

.kpi-bar-fill {
    height: 100%;
    background: rgba(255, 255, 255, 0.55);
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ═══ 地区联动探索 ═══ */
.region-explore {
    padding: 0 24px;
    margin-bottom: 28px;
}

.region-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.region-nav {
    display: flex;
    gap: 10px;
    padding-right: 24px;
}

.region-dot {
    width: 28px;
    height: 4px;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    position: relative;
}

.region-dot-line {
    display: block;
    height: 100%;
    background: #d4ccc4;
    transition: background 0.3s, transform 0.3s;
}

.region-dot:hover .region-dot-line {
    background: #8b7b6b;
}

.region-dot--active .region-dot-line {
    background: #1a1a1a;
    transform: scaleY(1.6);
}

.region-body {
    display: flex;
    gap: 3px;
    height: 420px;
}

/* 左侧：地区卡片 */
.region-card {
    flex: 4.5;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    cursor: pointer;
}

.region-photos {
    display: grid;
    grid-template-columns: 6fr 4fr;
    grid-template-rows: 1fr 1fr;
    gap: 2px;
    height: 220px;
    flex-shrink: 0;
}

.region-photo--0 {
    grid-column: 1;
    grid-row: 1/3;
}

.region-photo--1 {
    grid-column: 2;
    grid-row: 1;
}

.region-photo--2 {
    grid-column: 2;
    grid-row: 2;
}

.region-photo--3 {
    display: none;
}

.region-photo {
    overflow: hidden;
}

.region-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.45s;
}

.region-card:hover .region-photo img {
    transform: scale(1.04);
}

.region-info {
    padding: 16px 18px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.region-tag {
    font-size: 8px;
    font-weight: 800;
    color: #5c5c5c;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
}

.region-name {
    font-size: 20px;
    font-weight: 900;
    color: #1a1a1a;
    margin: 0 0 8px;
    letter-spacing: -0.5px;
}

.region-desc {
    font-size: 12px;
    color: #5c5c5c;
    line-height: 1.6;
    margin: 0 0 12px;
}

.region-cities {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.city-chip {
    font-size: 10px;
    font-weight: 700;
    color: #c45b3d;
    border: 1.5px solid #c45b3d;
    padding: 3px 10px;
    letter-spacing: 1px;
    transition: background 0.15s, color 0.15s;
}

.city-chip:hover {
    background: #c45b3d;
    color: #fff;
}

/* 右侧：地图 */
.region-map-wrap {
    flex: 5.5;
    background: #fff;
    position: relative;
}

.map-label {
    position: absolute;
    top: 14px;
    left: 18px;
    z-index: 5;
    font-size: 9px;
    font-weight: 700;
    color: #5c5c5c;
    letter-spacing: 2.5px;
    pointer-events: none;
}

.region-map-box {
    width: 100%;
    height: 100%;
    background: #edeae5;
}

/* ═══ 三栏数据 ═══ */
.three-col {
    display: flex;
    gap: 3px;
    padding: 0 24px;
    margin-bottom: 24px;
}

.col-block {
    flex: 1;
    background: #fff;
    padding: 18px 20px;
    min-height: 220px;
    display: flex;
    flex-direction: column;
}

.block-heading {
    font-size: 9px;
    font-weight: 800;
    color: #5c5c5c;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    margin: 0 0 8px;
}

.bold-divider {
    height: 2px;
    background: #1a1a1a;
    margin-bottom: 12px;
}

.bold-divider--wide {
    margin: 0 24px 20px;
}

.bar-stack {
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex: 1;
    overflow-y: auto;
}

.bar-row {
    display: grid;
    grid-template-columns: 18px 1fr 42px;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 1px 8px;
    padding: 2px 0;
    cursor: default;
    transition: background 0.1s;
}

.bar-row:hover,
.bar-row--hover {
    background: #f8f6f3;
}

.bar-rank {
    font-size: 9px;
    color: #c45b3d;
    font-weight: 800;
    font-family: var(--font-mono);
    grid-row: 1;
}

.bar-label {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    grid-row: 1;
}

.bar-figure {
    font-size: 12px;
    font-weight: 700;
    color: #1a1a1a;
    text-align: right;
    font-family: var(--font-mono);
    grid-row: 1;
}

.bar-track {
    grid-column: 2/4;
    grid-row: 2;
    height: 5px;
    background: #edeae5;
    margin-top: 1px;
}

.bar-gauge {
    height: 100%;
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.budget-grid {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex: 1;
}

.budget-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.budget-ring {
    width: 62px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-style: solid;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.budget-ring--active {
    transform: scale(1.14);
}

.budget-pct {
    font-size: 18px;
    font-weight: 900;
    color: #1a1a1a;
    font-family: var(--font-mono);
    letter-spacing: -0.5px;
}

.budget-name {
    font-size: 10px;
    font-weight: 700;
    color: #5c5c5c;
    letter-spacing: 1.5px;
}

.chart-box {
    flex: 1;
    min-height: 100px;
    width: 100%;
}

/* ═══ 区域标题 ═══ */
.section-title {
    font-size: 11px;
    font-weight: 800;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 3px;
    padding: 0 24px;
    margin: 0 0 4px;
}

/* ═══ 人气景点 ═══ */
.attractions-section {
    padding: 0 24px;
    margin-bottom: 28px;
}

.att-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
}

.att-card {
    background: #fff;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
}

.att-card--visible {
    opacity: 1;
    transform: translateY(0);
}

.att-card:hover {
    box-shadow: 0 0 0 3px #1a1a1a;
    z-index: 2;
}

.att-card-rank {
    position: absolute;
    top: 8px;
    left: 10px;
    font-size: 18px;
    font-weight: 900;
    color: #fff;
    font-family: var(--font-mono);
    z-index: 2;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.att-card-img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
    transition: transform 0.4s;
}

.att-card:hover .att-card-img {
    transform: scale(1.06);
}

.att-card-body {
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.att-card-name {
    font-size: 12px;
    font-weight: 700;
    color: #1a1a1a;
}

.att-card-value {
    font-size: 11px;
    font-weight: 700;
    color: #c45b3d;
    font-family: var(--font-mono);
}

/* ═══ 标签 ═══ */
.tags-section {
    padding: 0 24px;
    margin-bottom: 28px;
}

.tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 0 24px;
}

.tag-brick {
    padding: 5px 14px;
    font-weight: 700;
    cursor: pointer;
    border: 2px solid transparent;
    letter-spacing: 0.4px;
    white-space: nowrap;
    color: var(--tag-color);
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s, background 0.15s;
}

.tag-brick--revealed {
    opacity: 1;
    transform: translateY(0);
}

.tag-brick:hover,
.tag-brick--active {
    border-color: var(--tag-color);
    background: color-mix(in srgb, var(--tag-color) 10%, transparent);
    transform: scale(1.1);
}

/* ═══ 景点推荐 ═══ */
.spotlight-section {
    padding: 0 24px;
}

.spot-hero {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    margin-bottom: 4px;
    height: 340px;
}

.spot-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s;
}

.spot-hero:hover .spot-hero-img {
    transform: scale(1.03);
}

.spot-hero-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 40px 28px 28px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
    color: #fff;
}

.spot-hero-tag {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    border: 1.5px solid rgba(255, 255, 255, 0.8);
    padding: 3px 10px;
    display: inline-block;
    margin-bottom: 10px;
}

.spot-hero-title {
    font-size: 28px;
    font-weight: 900;
    margin: 0 0 6px;
    letter-spacing: -0.5px;
}

.spot-hero-desc {
    font-size: 13px;
    margin: 0;
    opacity: 0.85;
    max-width: 420px;
    line-height: 1.5;
}

.spot-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin-bottom: 4px;
}

.spot-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    height: 200px;
}

.spot-card-img-wrap {
    width: 100%;
    height: 100%;
}

.spot-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.45s;
}

.spot-card:hover .spot-card-img {
    transform: scale(1.05);
}

.spot-card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 16px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent);
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.spot-card-tag {
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.7);
    padding: 2px 8px;
    color: #fff;
    display: inline-block;
    align-self: flex-start;
}

.spot-card-title {
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.3px;
}

.spot-split {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
    height: 300px;
}

.spot-split--tall {
    flex: 4;
}

.spot-split--wide {
    flex: 6;
}

.spot-split-cell {
    position: relative;
    overflow: hidden;
    cursor: pointer;
}

/* ═══ 页脚 ═══ */
.page-footer {
    text-align: center;
    padding: 40px 0 20px;
}

.footer-line {
    height: 2px;
    background: #1a1a1a;
    width: 60px;
    margin: 0 auto 16px;
}

.page-footer span {
    font-size: 9px;
    font-weight: 800;
    color: #5c5c5c;
    letter-spacing: 3px;
    text-transform: uppercase;
}

/* ═══ 滚动条 ═══ */
.bar-stack::-webkit-scrollbar {
    width: 3px;
}

.bar-stack::-webkit-scrollbar-track {
    background: transparent;
}

.bar-stack::-webkit-scrollbar-thumb {
    background: #d4ccc4;
}
</style>
