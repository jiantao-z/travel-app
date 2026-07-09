<template>
  <div class="explore-container">
    <!-- 顶部导航 -->
    <div class="explore-topbar">
      <div class="explore-topbar-inner">
        <!-- 城市选择 -->
        <div class="city-select-group">
          <span class="city-eyebrow">DESTINATION</span>
          <select v-model="selectedCity" class="city-select">
            <option v-for="city in availableCities" :key="city" :value="city">{{ city }}</option>
          </select>
          <div class="city-select-accent"></div>
        </div>

        <!-- 分类标签 -->
        <div class="category-chips">
          <button
            v-for="cat in categories"
            :key="cat.key"
            :class="['chip', { 'chip--active': activeCategory === cat.key }]"
            @click="activeCategory = cat.key"
          >
            <span class="chip-dot" :style="{background: cat.color}"></span>
            {{ cat.label }}
          </button>
        </div>

        <!-- 迷你统计 -->
        <div class="explore-stats">
          <div class="mini-stat">
            <span class="mini-stat-num">{{ currentCityGuides.length }}</span>
            <span class="mini-stat-label">攻略</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-num">{{ totalPois }}</span>
            <span class="mini-stat-label">景点</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 攻略卡片瀑布流 -->
    <div class="guides-masonry">
      <div
        v-for="(guide, idx) in currentCityGuides"
        :key="guide.id"
        class="guide-card"
        :style="{ transitionDelay: (idx * 0.06) + 's' }"
      >
        <!-- 封面图 -->
        <div class="guide-cover" @click="showGuideDetail(guide)">
          <img :src="guide.coverImage" :alt="guide.title" class="guide-cover-img" loading="lazy" />
          <div class="guide-cover-overlay">
            <div class="guide-badges">
              <span class="guide-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ guide.pois.length }}景点
              </span>
              <span class="guide-badge guide-badge--dark">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                {{ daysEstimate(guide) }}天
              </span>
            </div>
            <!-- 热度条 -->
            <div class="guide-heat-bar">
              <div class="guide-heat-fill" :style="{width: heatPercent(guide) + '%', background: heatColor(guide)}"></div>
            </div>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="guide-body">
          <div class="guide-meta">
            <span class="guide-meta-item">
              <span class="guide-meta-dot" :style="{background: cardColors[idx % cardColors.length]}"></span>
              城市领航员
            </span>
            <span class="guide-meta-date">{{ formatDate() }}</span>
          </div>

          <h3 class="guide-title" @click="showGuideDetail(guide)">{{ guide.title }}</h3>
          <p class="guide-desc">{{ getExcerpt(guide) }}</p>

          <!-- 迷你数据条 -->
          <div class="guide-data-row">
            <div class="guide-data-item">
              <span class="guide-data-val">{{ mockLikes(guide) }}</span>
              <span class="guide-data-lbl">喜欢</span>
            </div>
            <div class="guide-data-item">
              <span class="guide-data-val">{{ mockComments(guide) }}</span>
              <span class="guide-data-lbl">评论</span>
            </div>
            <div class="guide-data-item">
              <span class="guide-data-val">{{ mockShares(guide) }}</span>
              <span class="guide-data-lbl">分享</span>
            </div>
            <button class="guide-save-btn" @click.stop="showGuideDetail(guide)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              查看
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情模态框 -->
    <div v-if="selectedGuide" class="detail-overlay" @click.self="closeGuideDetail">
      <div class="detail-modal">
        <button class="detail-close" @click="closeGuideDetail">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="3" y1="3" x2="21" y2="21"/><line x1="21" y1="3" x2="3" y2="21"/>
          </svg>
        </button>

        <!-- 轮播 -->
        <div class="detail-carousel">
          <div class="detail-carousel-track" :style="{transform: `translateX(-${currentImageIndex * 100}%)`}">
            <img v-for="(img, i) in selectedGuide.images" :key="i"
              :src="img" :alt="selectedGuide.title" class="detail-carousel-img" />
          </div>
          <div class="detail-carousel-dots">
            <button v-for="(_, i) in selectedGuide.images" :key="i"
              :class="['carousel-dot', {'carousel-dot--active': currentImageIndex === i}]"
              @click="currentImageIndex = i"></button>
          </div>
          <button v-if="selectedGuide.images.length > 1" class="carousel-arrow carousel-arrow--left" @click="prevImage">
            ←
          </button>
          <button v-if="selectedGuide.images.length > 1" class="carousel-arrow carousel-arrow--right" @click="nextImage">
            →
          </button>
        </div>

        <!-- 内容 -->
        <div class="detail-body">
          <div class="detail-header">
            <div class="detail-header-left">
              <span class="detail-eyebrow">TRAVEL GUIDE</span>
              <h2 class="detail-title">{{ selectedGuide.title }}</h2>
            </div>
            <div class="detail-header-right">
              <div class="detail-stat-ring">
                <span class="detail-stat-big">{{ selectedGuide.pois.length }}</span>
                <span class="detail-stat-small">景点</span>
              </div>
            </div>
          </div>

          <!-- 景点标签 -->
          <div class="detail-pois">
            <span v-for="poi in selectedGuide.pois" :key="poi" class="detail-poi-chip">
              <span class="detail-poi-dot"></span>
              {{ poi }}
            </span>
          </div>

          <!-- 正文 -->
          <div class="detail-content prose" v-html="compiledContent"></div>

          <!-- 底部操作 -->
          <div class="detail-actions">
            <button class="detail-action detail-action--primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              收藏攻略
            </button>
            <button class="detail-action" @click="closeGuideDetail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              返回
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { travelGuides } from '../../data/travelGuides';
import { marked } from 'marked';

export default {
  name: 'ExploreView',
  setup() {
    const selectedCity = ref(Object.keys(travelGuides)[0]);
    const selectedGuide = ref(null);
    const currentImageIndex = ref(0);
    const activeCategory = ref('all');

    const categories = [
      { key: 'all', label: '全部', color: '#1a1a1a' },
      { key: 'hot', label: '热门推荐', color: '#c45b3d' },
      { key: 'deep', label: '深度游', color: '#3d8b7e' },
      { key: 'food', label: '美食', color: '#d4a44a' },
      { key: 'culture', label: '文化', color: '#2d5f8b' },
    ];

    const cardColors = ['#c45b3d', '#d4a44a', '#5b8c6f', '#3d8b7e', '#2d5f8b', '#d4726a'];

    const availableCities = computed(() => Object.keys(travelGuides));
    const currentCityGuides = computed(() => travelGuides[selectedCity.value] || []);
    const totalPois = computed(() =>
      currentCityGuides.value.reduce((sum, g) => sum + (g.pois?.length || 0), 0)
    );

    const compiledContent = computed(() => {
      if (!selectedGuide.value) return '';
      return marked(selectedGuide.value.content);
    });

    // 虚拟数据
    const hashGuide = (g) => {
      let h = 0;
      for (let i = 0; i < (g.title || '').length; i++) { h = ((h << 5) - h) + g.title.charCodeAt(i); h |= 0; }
      return Math.abs(h);
    };

    const daysEstimate = (g) => Math.max(1, (hashGuide(g) % 5) + 1);
    const heatPercent = (g) => (hashGuide(g) % 55) + 45;
    const heatColor = (g) => cardColors[hashGuide(g) % cardColors.length];
    const mockLikes = (g) => {
      const n = (hashGuide(g) % 900) + 100;
      return n >= 1000 ? (n/1000).toFixed(1) + 'k' : n;
    };
    const mockComments = (g) => (hashGuide(g) % 80) + 10;
    const mockShares = (g) => (hashGuide(g) % 40) + 5;
    const formatDate = () => '2026.06';

    const getExcerpt = (guide) => {
      const lines = guide.content.split('\n').filter(l => l.trim() && !l.startsWith('##'));
      return lines[0]?.trim()?.slice(0, 80) + '...' || '';
    };

    const showGuideDetail = (guide) => { selectedGuide.value = guide; currentImageIndex.value = 0; };
    const closeGuideDetail = () => { selectedGuide.value = null; };
    const nextImage = () => {
      if (!selectedGuide.value) return;
      currentImageIndex.value = (currentImageIndex.value + 1) % selectedGuide.value.images.length;
    };
    const prevImage = () => {
      if (!selectedGuide.value) return;
      currentImageIndex.value = currentImageIndex.value === 0
        ? selectedGuide.value.images.length - 1 : currentImageIndex.value - 1;
    };

    return {
      selectedCity, availableCities, currentCityGuides, totalPois,
      selectedGuide, currentImageIndex, activeCategory, categories, cardColors,
      compiledContent, showGuideDetail, closeGuideDetail, nextImage, prevImage,
      daysEstimate, heatPercent, heatColor, mockLikes, mockComments, mockShares,
      formatDate, getExcerpt,
    };
  }
};
</script>

<style scoped>
/* ═══════════════════════════════════
   Bauhaus Geometric ExploreView
   ═══════════════════════════════════ */

.explore-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #f4f1ec;
  padding-bottom: 40px;
}

/* ── 顶栏 ── */
.explore-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  border-bottom: 3px solid #1a1a1a;
}

.explore-topbar-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 24px;
}

.city-select-group {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.city-eyebrow {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 3px;
  color: var(--text-muted);
}

.city-select {
  font-size: 18px;
  font-weight: 900;
  color: #1a1a1a;
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
  font-family: var(--font-sans);
  letter-spacing: 1px;
  padding: 4px 0;
}

.city-select-accent {
  width: 4px;
  height: 20px;
  background: var(--bauhaus-red);
}

/* ── 分类 ── */
.category-chips {
  display: flex;
  gap: 4px;
  flex: 1;
}

.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #1a1a1a;
  background: none;
  border: 2px solid transparent;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all var(--duration-fast);
  font-family: var(--font-sans);
}

.chip-dot { width: 6px; height: 6px; flex-shrink: 0; }

.chip:hover { background: #f8f6f3; border-color: #1a1a1a; }
.chip--active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }

/* ── 迷你统计 ── */
.explore-stats {
  display: flex;
  gap: 4px;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 8px 18px;
  background: #1a1a1a;
  color: #fff;
}

.mini-stat-num { font-size: 18px; font-weight: 900; font-family: var(--font-mono); }
.mini-stat-label { font-size: 8px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; opacity: 0.6; }

/* ── 瀑布流 ── */
.guides-masonry {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 24px;
  columns: 3;
  column-gap: 16px;
}

.guide-card {
  break-inside: avoid;
  margin-bottom: 16px;
  background: #ffffff;
  border: 2px solid transparent;
  transition: all var(--duration-normal) var(--ease-out);
  opacity: 0;
  transform: translateY(20px);
  animation: cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes cardEnter {
  to { opacity: 1; transform: translateY(0); }
}

.guide-card:hover { border-color: #1a1a1a; transform: translateY(-2px); }

/* ── 封面 ── */
.guide-cover {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  cursor: pointer;
  background: #edeae5;
}

.guide-cover-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.guide-cover:hover .guide-cover-img { transform: scale(1.04); }

.guide-cover-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 40px 14px 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.55), transparent);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-badges {
  display: flex;
  gap: 6px;
}

.guide-badge {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  font-size: 10px; font-weight: 700;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
  color: #fff;
  letter-spacing: 0.5px;
}
.guide-badge--dark { background: rgba(0,0,0,0.4); }

.guide-heat-bar {
  height: 3px;
  background: rgba(255,255,255,0.25);
}
.guide-heat-fill {
  height: 100%;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── 卡片内容 ── */
.guide-body {
  padding: 16px;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.guide-meta-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--text-muted);
}

.guide-meta-dot {
  width: 6px; height: 6px;
}

.guide-meta-date {
  font-size: 10px; color: var(--text-muted); letter-spacing: 1px;
}

.guide-title {
  font-size: 17px; font-weight: 900;
  color: #1a1a1a;
  margin: 0 0 8px;
  line-height: 1.3;
  cursor: pointer;
  letter-spacing: -0.2px;
}
.guide-title:hover { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; }

.guide-desc {
  font-size: 12px; color: var(--text-secondary);
  margin: 0 0 12px;
  line-height: 1.6;
}

/* ── 数据条 ── */
.guide-data-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 2px solid #f0eeea;
}

.guide-data-item {
  display: flex; flex-direction: column; gap: 1px;
}

.guide-data-val {
  font-size: 13px; font-weight: 800; color: #1a1a1a; font-family: var(--font-mono);
}

.guide-data-lbl {
  font-size: 9px; font-weight: 600; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase;
}

.guide-save-btn {
  margin-left: auto;
  display: flex; align-items: center; gap: 4px;
  padding: 8px 16px;
  font-size: 11px; font-weight: 800;
  background: #1a1a1a; color: #fff;
  border: none; cursor: pointer;
  font-family: var(--font-sans);
  letter-spacing: 1px;
  transition: background var(--duration-fast);
}
.guide-save-btn:hover { background: var(--bauhaus-red); }

/* ── 详情弹窗 ── */
.detail-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000;
}

.detail-modal {
  background: #ffffff;
  width: 90vw; max-width: 840px;
  max-height: 90vh; overflow-y: auto;
  border: 3px solid #1a1a1a;
  position: relative;
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.detail-close {
  position: absolute; top: 14px; right: 14px; z-index: 10;
  width: 36px; height: 36px;
  background: #1a1a1a; color: #fff;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.detail-close:hover { background: var(--bauhaus-red); }

/* 轮播 */
.detail-carousel {
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
}

.detail-carousel-track {
  display: flex;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.detail-carousel-img {
  width: 100%; min-width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.detail-carousel-dots {
  position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px;
}

.carousel-dot {
  width: 8px; height: 8px;
  border: 2px solid #fff; background: transparent;
  cursor: pointer; padding: 0;
  transition: background 0.2s;
}
.carousel-dot--active { background: #fff; }

.carousel-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 40px; height: 40px;
  background: rgba(0,0,0,0.4); color: #fff;
  border: none; cursor: pointer;
  font-size: 18px; font-weight: 900;
  transition: background 0.2s;
}
.carousel-arrow:hover { background: rgba(0,0,0,0.7); }
.carousel-arrow--left { left: 0; }
.carousel-arrow--right { right: 0; }

/* 内容 */
.detail-body { padding: 28px 32px; }

.detail-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px;
}

.detail-eyebrow {
  font-size: 8px; font-weight: 800; letter-spacing: 3px; color: var(--text-muted);
}

.detail-title {
  font-size: 26px; font-weight: 900; color: #1a1a1a;
  margin: 6px 0 0; letter-spacing: -0.5px;
}

.detail-stat-ring {
  width: 60px; height: 60px;
  border: 3px solid #1a1a1a;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}

.detail-stat-big {
  font-size: 18px; font-weight: 900; font-family: var(--font-mono); color: #1a1a1a;
}

.detail-stat-small {
  font-size: 8px; font-weight: 700; color: var(--text-muted); letter-spacing: 1px;
}

/* 景点标签 */
.detail-pois {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f6f3;
  border-left: 3px solid var(--bauhaus-red);
}

.detail-poi-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  font-size: 12px; font-weight: 600; color: #1a1a1a;
  background: #fff;
  border: 2px solid #e0dcd5;
}

.detail-poi-dot { width: 5px; height: 5px; background: var(--bauhaus-red); }

/* 正文 */
.detail-content { margin-bottom: 24px; }

.prose :deep(h2) {
  font-size: 18px; font-weight: 900; color: #1a1a1a;
  margin: 24px 0 12px;
  padding-top: 16px;
  border-top: 2px solid #1a1a1a;
}
.prose :deep(p) {
  font-size: 14px; color: var(--text-secondary); line-height: 1.9; margin-bottom: 12px;
}

/* 操作 */
.detail-actions {
  display: flex; gap: 12px;
  padding-top: 20px;
  border-top: 2px solid #f0eeea;
}

.detail-action {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px;
  font-size: 14px; font-weight: 700;
  cursor: pointer;
  font-family: var(--font-sans);
  background: #f8f6f3; color: #1a1a1a;
  border: 2px solid #e0dcd5;
  letter-spacing: 0.5px;
  transition: all var(--duration-fast);
}
.detail-action:hover { border-color: #1a1a1a; }

.detail-action--primary {
  background: #1a1a1a; color: #fff; border-color: #1a1a1a;
}
.detail-action--primary:hover { background: var(--bauhaus-red); border-color: var(--bauhaus-red); }

/* ── 响应式 ── */
@media (max-width: 1024px) { .guides-masonry { columns: 2; } }
@media (max-width: 640px)  {
  .guides-masonry { columns: 1; padding: 12px; }
  .explore-topbar-inner { flex-wrap: wrap; gap: 12px; }
  .detail-body { padding: 20px; }
}

/* 滚动条 */
.explore-container::-webkit-scrollbar { width: 6px; }
.explore-container::-webkit-scrollbar-thumb { background: #ccc; }
</style>
