const User = require('./user');
const POI = require('./poi');
const TravelPlan = require('./travelPlan');
const RoutePlan = require('./routePlan');

const Favorite = require('./favorite');
const FavoriteItem = require('./favoriteItem');
const Scenicpot = require('./scenicpot');
const Canteen = require('./canteen');
const Lodging = require('./lodging');

// 关联关系
User.hasMany(TravelPlan, { foreignKey: 'user_id' });
TravelPlan.belongsTo(User, { foreignKey: 'user_id' });

// 行程组与行程项关联
TravelPlan.hasMany(RoutePlan, { foreignKey: 'route_id', as: 'routePlans' });
RoutePlan.belongsTo(TravelPlan, { foreignKey: 'route_id', as: 'travelPlan' });






// 收藏夹与项目关联
Favorite.hasMany(FavoriteItem, { foreignKey: 'fav_id', as: 'items' });
FavoriteItem.belongsTo(Favorite, { foreignKey: 'fav_id', as: 'favorite' });

module.exports = {
  User,
  POI,
  TravelPlan,
  Favorite,
  FavoriteItem,
  scenicpot: Scenicpot,
  canteen: Canteen,
  lodging: Lodging,
  RoutePlan,
};