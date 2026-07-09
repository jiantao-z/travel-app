"""
国内旅游城市热度数据处理脚本
- 读取 Excel 数据
- 清洗异常值 & 插值缺失
- 计算城市热度分
- 高德地理编码获取坐标
- 输出 JSON 供前端使用
"""
import pandas as pd
import numpy as np
import json
import time
import os
import requests

# ===================== 配置 =====================
# 脚本所在目录
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# 项目根目录（scripts/ 的上一级）
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# 数据文件路径（相对于项目根目录）
EXCEL_PATH = os.path.join(PROJECT_ROOT, "数据文件", "excel格式的数据", "国内旅游人数.xlsx")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "frontend", "public", "JSON", "cityHeatData.json")
COORD_CACHE_PATH = os.path.join(SCRIPT_DIR, "city_coords_cache.json")

# 高德 Web 服务 API Key（从环境变量读取）
AMAP_WEB_KEY = os.environ.get("AMAP_KEY", "")
if not AMAP_WEB_KEY:
    print("⚠️  警告：未设置 AMAP_KEY 环境变量，地理编码将无法使用")

# ===================== 1. 读取数据 =====================
print("=" * 50)
print("Step 1: Reading Excel data")
df = pd.read_excel(EXCEL_PATH)
print(f"  Shape: {df.shape}")

# 重命名前两列
df = df.rename(columns={df.columns[0]: 'province', df.columns[1]: 'city'})

# 提取年份列和映射
year_cols = [c for c in df.columns if c not in ['province', 'city']]
year_name_map = {}  # int_year -> column_name_string
for col in year_cols:
    digits = ''.join(filter(str.isdigit, str(col)))
    if digits:
        year_name_map[int(digits)] = col

all_years = sorted(year_name_map.keys())
print(f"  Cities: {len(df)}, Provinces: {df['province'].nunique()}")
print(f"  Year range: {all_years[0]} - {all_years[-1]} ({len(all_years)} years)")

# ===================== 2. 清洗异常值 =====================
print("\nStep 2: Cleaning anomalies")

# 2.1 河池市 2002 年异常值 (435,662)
mask_hechi = (df['city'].str.contains('河池', na=False)) & (df['province'].str.contains('广西', na=False))
if mask_hechi.any():
    hechi_idx = df[mask_hechi].index[0]
    col_2002 = year_name_map[2002]
    old_val = df.loc[hechi_idx, col_2002]
    city_vals = df.loc[hechi_idx, year_cols].dropna()
    median_val = city_vals.median()
    df.loc[hechi_idx, col_2002] = median_val
    print(f"  Hechi 2002: {old_val} -> {median_val:.1f} (median replacement)")

# 2.2 负值和零值 -> NaN
neg_count = 0
for col in year_cols:
    mask = (df[col] < 0) | (df[col] == 0)
    neg_count += mask.sum()
    df.loc[mask, col] = np.nan
print(f"  Negative/zero values set to NaN: {neg_count}")

# ===================== 3. 插值填充缺失 =====================
print("\nStep 3: Interpolating missing values")

before_nan = df[year_cols].isna().sum().sum()

def interpolate_city_series(vals):
    """对单个城市的时间序列做线性插值"""
    s = pd.Series(vals.astype(float))
    s = s.ffill().bfill()  # 首尾填充
    if s.isna().all():
        s = s.fillna(0)
    s = s.interpolate(method='linear')
    s = s.ffill().bfill()  # 确保无NaN
    return s.values

# 按城市分组插值
interpolated_rows = []
for (prov, city), group in df.groupby(['province', 'city'], sort=False):
    row = group.iloc[0].copy()
    row[year_cols] = interpolate_city_series(row[year_cols])
    interpolated_rows.append(row)

df_clean = pd.DataFrame(interpolated_rows)
after_nan = df_clean[year_cols].isna().sum().sum()

print(f"  NaN before: {before_nan}, after: {after_nan}")
print(f"  Final records: {len(df_clean)}")

# ===================== 4. 计算热度分 =====================
print("\nStep 4: Calculating heat scores")

# 近年加权: 2019-2023
weight_years = {2019: 0.05, 2020: 0.10, 2021: 0.15, 2022: 0.25, 2023: 0.45}
# 过滤存在的年份
valid_weights = {y: w for y, w in weight_years.items() if y in year_name_map}
print(f"  Weighted years: {list(valid_weights.keys())}")

def calc_heat(row):
    total = 0.0
    for year, weight in valid_weights.items():
        col = year_name_map[year]
        val = row[col]
        if pd.notna(val) and val > 0:
            total += val * weight
    return total

df_clean['raw_heat'] = df_clean.apply(calc_heat, axis=1)

raw_min = df_clean['raw_heat'].min()
raw_max = df_clean['raw_heat'].max()
print(f"  Raw heat range: {raw_min:.1f} - {raw_max:.1f}")

df_clean['heat'] = ((df_clean['raw_heat'] - raw_min) / (raw_max - raw_min) * 100).round(1)
print(f"  Normalized heat range: {df_clean['heat'].min():.1f} - {df_clean['heat'].max():.1f}")

# ===================== 5. 获取城市坐标 =====================
print("\nStep 5: Getting city coordinates")

city_coords = {}
if os.path.exists(COORD_CACHE_PATH):
    with open(COORD_CACHE_PATH, 'r', encoding='utf-8') as f:
        city_coords = json.load(f)
    print(f"  Cached coords: {len(city_coords)} cities")

# 内置坐标库 (fallback)
BUILTIN_COORDS = {
    "北京": [116.40,39.90],"上海": [121.47,31.23],"广州": [113.28,23.13],"深圳": [114.06,22.54],
    "成都": [104.07,30.66],"西安": [108.95,34.26],"重庆": [106.50,29.53],"杭州": [120.15,30.29],
    "南京": [118.80,32.06],"武汉": [114.30,30.58],"长沙": [112.98,28.19],"天津": [117.20,39.13],
    "苏州": [120.59,31.30],"青岛": [120.38,36.07],"厦门": [118.11,24.49],"昆明": [102.71,25.04],
    "三亚": [109.51,18.25],"哈尔滨": [126.64,45.76],"拉萨": [91.13,29.66],"沈阳": [123.43,41.80],
    "大连": [121.61,38.91],"济南": [117.00,36.67],"郑州": [113.65,34.76],"合肥": [117.28,31.86],
    "南昌": [115.86,28.68],"福州": [119.30,26.08],"南宁": [108.33,22.82],"贵阳": [106.71,26.57],
    "兰州": [103.83,36.06],"西宁": [101.78,36.62],"银川": [106.23,38.49],"乌鲁木齐": [87.62,43.82],
    "呼和浩特": [111.67,40.82],"石家庄": [114.51,38.04],"太原": [112.55,37.87],"长春": [125.32,43.90],
    "海口": [110.33,20.03],"宁波": [121.54,29.87],"无锡": [120.31,31.49],"徐州": [117.18,34.27],
    "常州": [119.97,31.81],"温州": [120.70,28.00],"绍兴": [120.58,30.03],"嘉兴": [120.76,30.75],
    "金华": [119.65,29.08],"台州": [121.42,28.66],"泉州": [118.59,24.91],"漳州": [117.65,24.51],
    "珠海": [113.58,22.27],"东莞": [113.75,23.05],"佛山": [113.12,23.02],"中山": [113.38,22.52],
    "惠州": [114.42,23.11],"汕头": [116.68,23.35],"湛江": [110.36,21.27],"肇庆": [112.47,23.05],
    "江门": [113.08,22.58],"桂林": [110.29,25.27],"柳州": [109.41,24.33],"北海": [109.12,21.48],
    "洛阳": [112.45,34.62],"开封": [114.31,34.80],"安阳": [114.39,36.10],"新乡": [113.88,35.30],
    "南阳": [112.53,32.99],"商丘": [115.66,34.44],"信阳": [114.08,32.13],"周口": [114.70,33.63],
    "许昌": [113.85,34.03],"平顶山": [113.19,33.77],"驻马店": [114.02,32.98],"焦作": [113.24,35.22],
    "濮阳": [115.03,35.76],"漯河": [114.02,33.58],"三门峡": [111.20,34.77],"鹤壁": [114.30,35.75],
    "宜昌": [111.29,30.69],"襄阳": [112.14,32.04],"荆州": [112.24,30.33],"黄冈": [114.87,30.45],
    "十堰": [110.80,32.63],"孝感": [113.93,30.92],"荆门": [112.20,31.04],"鄂州": [114.89,30.39],
    "黄石": [115.08,30.20],"咸宁": [114.33,29.84],"随州": [113.38,31.69],"恩施": [109.49,30.27],
    "岳阳": [113.13,29.36],"常德": [111.70,29.03],"株洲": [113.13,27.83],"湘潭": [112.94,27.83],
    "衡阳": [112.57,26.89],"郴州": [113.03,25.77],"邵阳": [111.47,27.24],"益阳": [112.36,28.58],
    "永州": [111.61,26.22],"怀化": [110.00,27.57],"娄底": [112.01,27.70],"张家界": [110.48,29.13],
    "九江": [115.99,29.70],"景德镇": [117.18,29.27],"赣州": [114.93,25.83],"上饶": [117.97,28.45],
    "宜春": [114.42,27.82],"吉安": [115.00,27.11],"抚州": [116.36,27.95],"芜湖": [118.43,31.35],
    "蚌埠": [117.39,32.92],"安庆": [117.06,30.54],"马鞍山": [118.51,31.67],"阜阳": [115.81,32.89],
    "亳州": [115.78,33.84],"淮北": [116.80,33.97],"铜陵": [117.82,30.93],"宣城": [118.76,30.94],
    "滁州": [118.32,32.30],"池州": [117.49,30.66],"六安": [116.52,31.74],"宿州": [116.97,33.63],
    "黄山": [118.34,29.72],"淮安": [119.02,33.61],"盐城": [120.16,33.35],"扬州": [119.41,32.39],
    "镇江": [119.44,32.19],"泰州": [119.92,32.46],"宿迁": [118.28,33.96],"连云港": [119.17,34.60],
    "南通": [120.89,31.98],"绵阳": [104.68,31.47],"宜宾": [104.62,28.77],"德阳": [104.40,31.13],
    "南充": [106.11,30.80],"泸州": [105.44,28.87],"达州": [107.50,31.21],"乐山": [103.77,29.57],
    "眉山": [103.85,30.08],"遂宁": [105.57,30.53],"内江": [105.06,29.58],"广安": [106.63,30.46],
    "巴中": [106.77,31.86],"广元": [105.82,32.44],"资阳": [104.63,30.13],"自贡": [104.78,29.34],
    "攀枝花": [101.72,26.58],"雅安": [103.04,29.98],"遵义": [106.93,27.73],"安顺": [105.95,26.25],
    "六盘水": [104.83,26.59],"毕节": [105.29,27.28],"铜仁": [109.19,27.73],"曲靖": [103.80,25.50],
    "玉溪": [102.55,24.35],"保山": [99.17,25.11],"昭通": [103.72,27.34],"丽江": [100.23,26.88],
    "普洱": [100.97,22.78],"临沧": [100.09,23.88],"大理": [100.23,25.61],"咸阳": [108.71,34.33],
    "宝鸡": [107.24,34.36],"渭南": [109.50,34.50],"延安": [109.49,36.59],"汉中": [107.03,33.07],
    "榆林": [109.73,38.29],"安康": [109.03,32.68],"商洛": [109.94,33.87],"铜川": [109.08,35.07],
    "天水": [105.72,34.58],"嘉峪关": [98.29,39.77],"金昌": [102.18,38.52],"白银": [104.14,36.54],
    "武威": [102.64,37.93],"张掖": [100.46,38.93],"平凉": [106.67,35.54],"酒泉": [98.52,39.74],
    "庆阳": [107.64,35.71],"定西": [104.62,35.58],"陇南": [104.92,33.40],"吴忠": [106.20,37.99],
    "固原": [106.24,36.02],"中卫": [105.19,37.51],"石嘴山": [106.38,39.02],"克拉玛依": [84.87,45.59],
    "吐鲁番": [89.17,42.95],"哈密": [93.51,42.83],"库尔勒": [86.15,41.75],"阿克苏": [80.26,41.17],
    "喀什": [75.99,39.47],"和田": [79.92,37.11],"赤峰": [118.89,42.26],"通辽": [122.24,43.62],
    "鄂尔多斯": [109.78,39.61],"包头": [109.84,40.66],"乌海": [106.79,39.69],"乌兰察布": [113.13,41.00],
    "巴彦淖尔": [107.39,40.74],"吉林": [126.55,43.84],"四平": [124.37,43.17],"通化": [125.94,41.73],
    "白山": [126.42,41.94],"松原": [124.82,45.14],"白城": [122.84,45.62],"延吉": [129.51,42.91],
    "丹东": [124.35,40.00],"锦州": [121.13,41.10],"营口": [122.23,40.67],"盘锦": [122.07,41.12],
    "阜新": [121.67,42.02],"辽阳": [123.17,41.27],"葫芦岛": [120.84,40.71],"铁岭": [123.84,42.29],
    "抚顺": [123.96,41.88],"本溪": [123.77,41.30],"鞍山": [122.99,41.11],"大庆": [125.03,46.59],
    "齐齐哈尔": [123.97,47.35],"牡丹江": [129.63,44.55],"佳木斯": [130.32,46.80],"鸡西": [130.97,45.30],
    "鹤岗": [130.30,47.33],"双鸭山": [131.16,46.65],"伊春": [128.84,47.73],"七台河": [131.00,45.77],
    "黑河": [127.49,50.25],"绥化": [126.97,46.64],"唐山": [118.18,39.63],"秦皇岛": [119.60,39.93],
    "邯郸": [114.54,36.63],"邢台": [114.50,37.07],"保定": [115.47,38.87],"张家口": [114.89,40.82],
    "承德": [117.93,40.97],"沧州": [116.84,38.30],"廊坊": [116.68,39.52],"衡水": [115.67,37.74],
    "德州": [116.36,37.43],"滨州": [118.02,37.38],"东营": [118.67,37.43],"聊城": [115.99,36.46],
    "菏泽": [115.48,35.23],"泰安": [117.09,36.20],"济宁": [116.59,35.41],"枣庄": [117.32,34.86],
    "临沂": [118.35,35.05],"日照": [119.53,35.42],"淄博": [118.05,36.81],"潍坊": [119.16,36.71],
    "烟台": [121.45,37.46],"威海": [122.12,37.51],"大同": [113.30,40.08],"阳泉": [113.57,37.86],
    "长治": [113.12,36.20],"晋城": [112.85,35.49],"朔州": [112.43,39.33],"晋中": [112.75,37.69],
    "运城": [111.00,35.03],"忻州": [112.73,38.42],"临汾": [111.52,36.08],"吕梁": [111.14,37.52],
    "朝阳": [120.45,41.58],"迪庆": [99.70,27.82],"临夏": [103.21,35.60],"德宏": [98.58,24.43],
    "西双版纳": [100.80,22.01],"凉山": [102.27,27.90],"阿坝": [102.22,31.90],"甘孜": [101.96,30.05],
}

for name, coord in BUILTIN_COORDS.items():
    if name not in city_coords:
        city_coords[name] = coord

def geocode_city(city_name, province_name=""):
    """通过高德 API 获取城市坐标"""
    if city_name in city_coords:
        return city_coords[city_name]

    query = f"{province_name}{city_name}" if province_name else city_name
    try:
        params = {'key': AMAP_WEB_KEY, 'address': query}
        resp = requests.get("https://restapi.amap.com/v3/geocode/geo", params=params, timeout=5)
        data = resp.json()
        if data['status'] == '1' and data['geocodes']:
            loc = data['geocodes'][0]['location']
            lng, lat = loc.split(',')
            coords = [float(lng), float(lat)]
            city_coords[city_name] = coords
            return coords
    except Exception as e:
        print(f"    Geocode failed [{city_name}]: {e}")
    return None

# 为所有城市获取坐标
missing = 0
geocode_count = 0
for idx, row in df_clean.iterrows():
    city = row['city']
    province = row['province']
    if city not in city_coords:
        coords = geocode_city(city, province)
        if coords:
            geocode_count += 1
        else:
            missing += 1
            # 兜底：用省会或默认北京
            prov_short = province.replace('省','').replace('市','').replace('自治区','').replace('特别行政区','')
            if prov_short in city_coords:
                city_coords[city] = city_coords[prov_short]
            elif province in city_coords:
                city_coords[city] = city_coords[province]
            else:
                city_coords[city] = [116.40, 39.90]
        time.sleep(0.08)

# 保存缓存
with open(COORD_CACHE_PATH, 'w', encoding='utf-8') as f:
    json.dump(city_coords, f, ensure_ascii=False, indent=2)

print(f"  Total coords: {len(city_coords)} (API calls: {geocode_count}, fallback: {missing})")

# 添加坐标到数据
df_clean['lng'] = df_clean['city'].apply(lambda c: city_coords.get(c, [116.40,39.90])[0])
df_clean['lat'] = df_clean['city'].apply(lambda c: city_coords.get(c, [116.40,39.90])[1])

# ===================== 6. 输出 JSON =====================
print("\nStep 6: Outputting JSON")

output = []
for _, row in df_clean.iterrows():
    output.append({
        'city': str(row['city']),
        'province': str(row['province']),
        'lng': round(float(row['lng']), 4),
        'lat': round(float(row['lat']), 4),
        'heat': float(row['heat']),
        'raw_value': round(float(row['raw_heat']), 1)
    })

output.sort(key=lambda x: x['heat'], reverse=True)

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"  Output: {OUTPUT_PATH}")
print(f"  Records: {len(output)}")
print(f"\n  Top 5:")
for item in output[:5]:
    print(f"    {item['city']}({item['province']}) heat={item['heat']:.1f} raw={item['raw_value']:.1f}")
print(f"\n  Bottom 5:")
for item in output[-5:]:
    print(f"    {item['city']}({item['province']}) heat={item['heat']:.1f} raw={item['raw_value']:.1f}")

print("\nDone!")
