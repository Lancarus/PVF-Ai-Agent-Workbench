# 深渊组可视化字段词典

状态：默认可用

## 三层闭环

```text
dungeon/*.dgn
  [hell dungeon]
  [seal door map index]
       -> map/map.lst
map/**/hell_*.map
  [special passive object]
  [hellparty]
       -> etc/hellparty.etc
            [difficulty]
            [hellparty monster group]
            [group index]
            [group]
```

## `.dgn` 深渊入口

### `[hell dungeon]`

状态：默认可用

含义：副本具备深渊配置的静态线索。

边界：不证明深渊按钮出现、门票有效、柱子刷出或服务端放行。

### `[seal door map index]`

状态：默认可用

含义：封印门/深渊地图 ID，按 `map/map.lst` 解析。

边界：不能按数字外形猜路径。

### 无显式 map ID 的分支

状态：需验证

有些 `.dgn` 可能只有 `[escape hell]` 或其他深渊线索，没有显式 `[seal door map index]`。可以按同目录、同 stem 的 `hell_<stem>.map` 等形状提出候选，但必须标记 candidate，并通过 `.map [dungeon]`、引用邻居或实机进一步闭合。

## Hell map

### `[special passive object]`

状态：默认可用

深渊柱常见于此块。记录至少要分离 object ID、X、Y、Z 和生成数量候选；object ID 按 `passiveobject/passiveobject.lst` 解析。

边界：这是对象记录的一个已观察形状，不得把所有特殊对象都解释成深渊柱。

### `[hellparty]`

状态：默认可用

在已确认的目标记录形状中，每组三个值表示：

1. `group_id`
2. `weight`
3. `wave`

`group_id` 必须在 `etc/hellparty.etc [group index]` 中闭合。`weight` 是组选择权重线索，不应直接换算成实机概率。`wave` 是波次/阶段线索；`1-9` 只可作为常见输入范围，超出或缺失时读取目标邻居，不设全版本硬限制。

## `etc/hellparty.etc`

### `[difficulty]`

状态：需验证

含义：深渊难度档位或难度参数表。

边界：必须保留原标签、行列和未识别参数；不把界面上的说明文字提升为所有版本的列义。

### `[hellparty monster group]`

状态：默认可用

含义：深渊怪物组定义区域。

### `[group index]`

状态：默认可用

含义：group ID 到组定义的索引入口。可视化必须报告 map 引用但 index 缺失，以及 index 存在但没有组定义的情况。

### `[group]`

状态：默认可用

在已确认记录形状中，每个成员按二元组读取：

1. `member_id`
2. `kind`

`kind = 0` 时，`member_id` 按 `monster/monster.lst` 解析；`kind = 1` 时，按 `aicharacter/aicharacter.lst` 解析。其他 kind 保持 unknown，先找目标 PVF 最近邻，不能回退到 monster registry 猜测。

组定义可能再按 A-E 等档位分层。档位标签应原样保留；未经过目标字段和行为验证时，不把某个界面的“掉落、经验、参数三、参数四”等显示名当通用列义。

### 重复成员与可见名称

状态：需验证

同一 `[group]` 可以重复列出相同的 `member_id / kind`。预览、迁移和写回都必须保留顺序与重复项；静态重复数不等于实机精确生成数，最终数量仍需目标版本验证。

游戏 UI 通常只显示成员名称而不显示 ID。测试者提供可见名称、所在波次和组合即可；Agent 应先按 map 中该波的候选 group 收窄，再按 `[group]` 的 kind 选择 registry，并联合 AIC / monster 目标文件的名称 token、路径和成员组合反查。只有组合唯一闭合时才绑定 group；重名、乱码或多组同构时保持 ambiguous。

## 可视化输出字段

一份合格的只读结果至少包含：

- dungeon ID、`.dgn` 路径和深渊入口形状。
- seal map ID、解析路径或候选路径与置信状态。
- 深渊柱 object ID、registry 路径和坐标。
- 每条 `group_id / weight / wave`。
- 每个 group 的档位、成员 ID、kind、解析 registry 和文件路径。
- 可选实机回填的可见名称、实际波次、静态成员数与实机观察下界；四者分列，不伪造精确计数。
- duplicate、missing-index、missing-group、unknown-kind、unresolved-registry 等异常。
- 客户端资源候选和仍需实机验证的行为清单。

可视化报告不修改 `.dgn`、`.map`、`.etc` 或客户端文件。
