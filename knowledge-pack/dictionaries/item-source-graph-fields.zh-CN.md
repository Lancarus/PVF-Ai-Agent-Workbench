# 物品来源图词典

状态：需验证

## 核心路径族

- `etc/itemdictionary/(r)itemdictionary.etc`
- `etc/itemdictionary/(r)baseitemdictionarytable.etc`
- `etc/itemdictionary/(r)independentdropinfo.etc`
- `etc/itemdictionary/(r)dungeondropinfo.etc`
- `etc/itemdictionary/(r)dungeon_name.etc`
- `etc/itemdictionary/(r)unvisibleitem.etc`
- `etc/itemdictionary/(r)lotterylistmakeequip.etc`
- `etc/itemdictionary/(r)recipelistmakeequip.etc`

`(r)` 表示不同目标可能存在常规与带 `r` 前缀的并行文件名。必须先确认目标实际路径，不能自动把两套表互相覆盖。

## 来源边类型

| 来源类别 | 典型引用方 |
| --- | --- |
| 任务固定 / 可选奖励 | `.qst` 奖励块 |
| 邮件、接取给予、通关、怪物 / 敌人奖励 | 任务与活动配置 |
| 独立掉落 | `independent_drop.etc` 与 sidecar |
| 副本等级掉落 | dungeon drop 支持表 |
| NPC 商店 / 加百利 / 商城 | `.shp`、secret shop、cash shop |
| 礼盒 / 随机包 / 自选包 / 魔盒 | `.stk` booster / package 块 |
| 摇号 / 抽取 | lottery 支持表 |
| 设计图 / 制作 | recipe 支持表 |

## 图节点身份

- 物品节点不能只用裸数字；必须记录它是 equipment、stackable 或其他 registry 的已解析实体。
- 来源节点记录具体路径、父块、来源类别和可读状态。
- 边记录固定 / 可选 / 随机 / 权重 / 数量 / 条件等可静态观察的形状；不把概率表写成实机发放事实。
- unresolved ID、动态脚本引用、模板路径和读取失败必须留在图中。

物品来源图是反向导航索引，不是最终证据，也不默认重写 itemdictionary 大表。查询某一来源时必须读回目标引用文件；0 条来源不证明物品无法获得。

