-- TravelDesigner 数据库完整SQL文件

-- 创建数据库
CREATE DATABASE traveldesigner;

-- 连接到数据库
\c traveldesigner;

-- 启用PostGIS扩展
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. 用户表(users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 景区表 (scenicpot) - 保留，用于主页面ArcGIS展示
CREATE TABLE scenicpot (
    scenic_id TEXT PRIMARY KEY,     -- 格式S1,S2
    name TEXT NOT NULL,             -- 景区名
    province TEXT,                  -- 所属省
    city TEXT,                      -- 所属市
    district TEXT,                  -- 所属区
    type SMALLINT NOT NULL CHECK (type BETWEEN 1 AND 3),  -- 类型(1自然风光/2历史文化/3现代娱乐)
    coordinates GEOMETRY(Polygon, 4326),  -- 地理多边形数据集(WGS84坐标系)
    address TEXT,                   -- 详细地址
    geo_point GEOMETRY(Point, 4326) -- 地理点数据集(经纬度坐标)
);

-- 3. 餐厅表 (canteen) - 保留，用于主页面ArcGIS展示
CREATE TABLE canteen (
    canteen_id TEXT PRIMARY KEY,    -- 格式C1,C2
    name TEXT NOT NULL,             -- 餐厅名
    province TEXT,                  -- 所属省
    city TEXT,                      -- 所属市
    district TEXT,                  -- 所属区
    type SMALLINT NOT NULL CHECK (type BETWEEN 1 AND 3),  -- 类型(1中餐/2西餐/3茶饮)
    coordinates GEOMETRY(Point, 4326) NOT NULL,  -- 地理点数据集(经纬度坐标)
    address TEXT                    -- 详细地址
);

-- 4. 住宿表 (lodging) - 保留，用于主页面ArcGIS展示
CREATE TABLE lodging (
    lodging_id TEXT PRIMARY KEY,    -- 格式L1,L2
    name TEXT NOT NULL,             -- 酒店名
    province TEXT,                  -- 所属省
    city TEXT,                      -- 所属市
    district TEXT,                  -- 所属区
    star_rating SMALLINT CHECK (star_rating BETWEEN 1 AND 5),  -- 星级(1-5)
    coordinates GEOMETRY(Point, 4326) NOT NULL,  -- 地理点数据集(经纬度坐标)
    address TEXT                    -- 详细地址
);

-- 5. 路线表 (routes)
CREATE TABLE routes (
    route_id SERIAL PRIMARY KEY,    -- 自增整数主键
    title TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,         -- 开始时间
    end_time TIMESTAMPTZ,           -- 结束时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,                     -- 备注
    departure_point TEXT            -- 出发点
);

-- 6. 详细路线安排表 (route_plans) - 解耦版
CREATE TABLE route_plans (
    plan_id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    name TEXT NOT NULL,             -- 地点名称（直接存储，不依赖外键）
    address TEXT,                   -- 地点地址
    longitude DOUBLE PRECISION,     -- 经度
    latitude DOUBLE PRECISION,      -- 纬度
    sort_order INTEGER NOT NULL,   -- 排序顺序
    estimated_arrival TIMESTAMPTZ NOT NULL,  -- 预计到达时间
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),  -- 停留时长(分钟)
    transportation_mode VARCHAR(50) -- 交通方式
);

-- 7. 收藏夹表 (favorites)
CREATE TABLE favorites (
    fav_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 收藏夹项目内容 (favorite_items) - 解耦版
CREATE TABLE favorite_items (
    item_id SERIAL PRIMARY KEY,
    fav_id INTEGER NOT NULL REFERENCES favorites(fav_id) ON DELETE CASCADE,
    name TEXT NOT NULL,             -- 地点名称（直接存储，不依赖外键）
    address TEXT NOT NULL,          -- 地点地址
    longitude DOUBLE PRECISION,     -- 经度
    latitude DOUBLE PRECISION,      -- 纬度
    sort_order INTEGER NOT NULL,    -- 排序顺序
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (fav_id, name, address) -- 防止重复收藏（基于名称和地址）
);

-- 插入示例数据

-- 插入用户数据
INSERT INTO users (id, username, password, created_at) VALUES
(1, 'testuser', '$2b$10$example_hash', NOW());

-- 插入景区数据 (自然/历史/现代各1个)
INSERT INTO scenicpot (scenic_id, name, province, city, district, type, coordinates, address, geo_point) VALUES
('S1', '深圳莲花山公园', '广东省', '深圳市', '福田区', 1, 
 ST_GeomFromText('POLYGON((114.057 22.550, 114.065 22.550, 114.065 22.555, 114.057 22.555, 114.057 22.550))', 4326),
 '红荔路6030号', 
 ST_GeomFromText('POINT(114.061 22.552)', 4326)),

('S2', '大鹏所城', '广东省', '深圳市', '大鹏新区', 2, 
 ST_GeomFromText('POLYGON((114.541 22.586, 114.548 22.586, 114.548 22.592, 114.541 22.592, 114.541 22.586))', 4326),
 '鹏飞路大鹏所城', 
 ST_GeomFromText('POINT(114.545 22.589)', 4326)),

('S3', '世界之窗', '广东省', '深圳市', '南山区', 3, 
 ST_GeomFromText('POLYGON((113.968 22.532, 113.975 22.532, 113.975 22.538, 113.968 22.538, 113.968 22.532))', 4326),
 '深南大道9037号', 
 ST_GeomFromText('POINT(113.972 22.535)', 4326));

-- 插入餐厅数据 (中餐/西餐/茶饮各1个)
INSERT INTO canteen (canteen_id, name, province, city, district, type, coordinates, address) VALUES
('C1', '春满园', '广东省', '深圳市', '南山区', 1, 
 ST_GeomFromText('POINT(113.934 22.520)', 4326),
 '南海大道2616号'),
 
('C2', '王品牛排', '广东省', '深圳市', '罗湖区', 2, 
 ST_GeomFromText('POINT(114.118 22.542)', 4326),
 '宝安南路1881号华润中心万象城'),
 
('C3', '喜茶', '广东省', '深圳市', '福田区', 3, 
 ST_GeomFromText('POINT(114.055 22.537)', 4326),
 '福华三路星河COCO Park');

-- 插入住宿数据 (不同星级各1个)
INSERT INTO lodging (lodging_id, name, province, city, district, star_rating, coordinates, address) VALUES
('L1', '深圳瑞吉酒店', '广东省', '深圳市', '罗湖区', 5, 
 ST_GeomFromText('POINT(114.109 22.540)', 4326),
 '深南东路5016号'),
 
('L2', '深圳绿景锦江酒店', '广东省', '深圳市', '福田区', 4, 
 ST_GeomFromText('POINT(114.048 22.540)', 4326),
 '新洲路3099号'),
 
('L3', '深圳维也纳酒店', '广东省', '深圳市', '南山区', 3, 
 ST_GeomFromText('POINT(113.931 22.523)', 4326),
 '南海大道2005号');

-- 创建路线 (用户ID=1)
INSERT INTO routes (route_id, title, user_id, start_time, end_time, created_at, notes, departure_point) VALUES
(1, '深圳经典一日游', 1, '2025-07-22 09:00:00+08', '2025-07-22 20:00:00+08', NOW(), '包含深圳三大经典景点', '深圳北站');

-- 创建路线详情 (解耦版，直接存储地点信息)
INSERT INTO route_plans (route_id, name, address, longitude, latitude, sort_order, estimated_arrival, duration_minutes, transportation_mode) VALUES
(1, '世界之窗', '深南大道9037号', 113.972, 22.535, 1, '2025-07-22 09:30:00+08', 180, '地铁'),
(1, '春满园', '南海大道2616号', 113.934, 22.520, 2, '2025-07-22 12:30:00+08', 90, '步行'),
(1, '深圳瑞吉酒店', '深南东路5016号', 114.109, 22.540, 3, '2025-07-22 19:00:00+08', 60, '打车');

-- 创建收藏夹
INSERT INTO favorites (fav_id, user_id, title, created_at) VALUES
(1, 1, '深圳必去景点', NOW()),
(2, 1, '特色美食推荐', NOW()),
(3, 1, '高端住宿体验', NOW());

-- 向收藏夹添加项目 (解耦版，直接存储地点信息)
INSERT INTO favorite_items (fav_id, name, address, longitude, latitude, sort_order) VALUES
(1, '世界之窗', '深南大道9037号', 113.972, 22.535, 1),
(2, '王品牛排', '宝安南路1881号华润中心万象城', 114.118, 22.542, 1),
(3, '深圳瑞吉酒店', '深南东路5016号', 114.109, 22.540, 1);

-- 创建索引优化查询性能

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);

-- 路线表索引
CREATE INDEX idx_routes_user_id ON routes(user_id);
CREATE INDEX idx_routes_created_at ON routes(created_at);

-- 路线安排表索引
CREATE INDEX idx_route_plans_route_id ON route_plans(route_id);
CREATE INDEX idx_route_plans_sort_order ON route_plans(sort_order);

-- 收藏夹表索引
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at);

-- 收藏夹项目表索引
CREATE INDEX idx_favorite_items_fav_id ON favorite_items(fav_id);
CREATE INDEX idx_favorite_items_sort_order ON favorite_items(sort_order);

-- 地点表索引（保留，用于主页面展示）
CREATE INDEX idx_scenicpot_name ON scenicpot(name);
CREATE INDEX idx_canteen_name ON canteen(name);
CREATE INDEX idx_lodging_name ON lodging(name);

-- 序列值设置
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('routes_route_id_seq', (SELECT MAX(route_id) FROM routes));
SELECT setval('route_plans_plan_id_seq', (SELECT MAX(plan_id) FROM route_plans));
SELECT setval('favorites_fav_id_seq', (SELECT MAX(fav_id) FROM favorites));
SELECT setval('favorite_items_item_id_seq', (SELECT MAX(item_id) FROM favorite_items));

