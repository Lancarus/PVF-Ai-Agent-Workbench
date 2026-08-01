# RandomOption / Mystic 字段字典

状态：默认可用


## 文件入口

| 入口 | 目标核验 | 读法 |
| --- | --- | --- |
| `etc/randomoption/randomoption.lst` | 需在当前目标 PVF 中只读确认 | 随机词条 ID 先走该 registry，再读 `etc/randomoption/options/*.etc`。 |
| `etc/randomoption/randomoptionskill.lst` | 需在当前目标 PVF 中只读确认 | 只能记录为缺文件风险；不能当可用技能随机词条池。 |
| `etc/randomoption/options/*.etc` | 需在当前目标 PVF 中只读确认 | 词条文件通常含 `[option]`、`[level]` 和一个或多个属性字段。 |
| `etc/randomoption/*.etc` 固定配置 | 需在当前目标 PVF 中只读确认 | 这些不是“漏注册词条文件”，而是全局选择、数量、部位、分类、再生等支持表。 |
| `etc/avatar_roulette/avatarfixedhiddenoptionlist.etc` | 需在当前目标 PVF 中只读确认 | 属于 avatar roulette / hidden option 配置，不等同 equipment `[hidden option]`。 |
| `stackable/emblem/hidden_option.stk` | 需在当前目标 PVF 中只读确认 | 不要按教程或外部路径假定该文件存在。 |

## 随机词条字段

| 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `[option]` | 需在当前目标 PVF 中只读确认 | 文件名和内部 `[option]` 仍需逐文件核对，不能只看文件名。 |
| `[level]` | 需在当前目标 PVF 中只读确认 | 静态等级行不证明该词条会在该等级装备上实机出现。 |
| 属性字段 | 需在当前目标 PVF 中只读确认 | 字段名和数值范围只证明静态配置；不证明最终角色面板、概率或客户端显示。 |

## 支持表字段

| 文件 / 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `randomizedoptionoverall1.etc` | 需在当前目标 PVF 中只读确认 | 可作为随机应用、等级、基础物品和选项类型线索；不证明实机抽取结果。 |
| `randomizedoptionoverall2.etc` | 需在当前目标 PVF 中只读确认 | 可见封印、后缀、权重和改造线索；不证明扣费、解封或再生成功。 |
| `optiongrouping.etc` / `[option group]` | 需在当前目标 PVF 中只读确认 | 组内 ID 应回到 `randomoption.lst` 检查；权重不等于实机概率已验。 |
| `optiongroupselection.etc` | 需在当前目标 PVF 中只读确认 | 部位 token 不是 registry ID；数字列不能裸猜语义。 |
| `optionquantity.etc` | 需在当前目标 PVF 中只读确认 | 只证明静态数量/比例配置；不证明最终抽到几条。 |
| `partselection.etc` / `[part type]` | 需在当前目标 PVF 中只读确认 | 部位选择和实际装备可用性仍需运行验证。 |
| `optionnumbering.etc` | 需在当前目标 PVF 中只读确认 | 可作数值比例线索；不证明最终数值浮动算法。 |
| `auctionrandomcategory.etc` | 需在当前目标 PVF 中只读确认 | 只作为拍卖/分类显示或筛选线索；不证明 UI 分类一定正常。 |
| `regenerationrandomoption.etc` | 需在当前目标 PVF 中只读确认 | 可作再生选项、数量调整和价格线索；不证明再生消耗或服务器放行。 |

## Equipment 侧字段

| 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `[random option]` | 需在当前目标 PVF 中只读确认 | 它是装备侧规则字段，不是词条池本体；不能压缩成“已确认可随机出词条”。 |
| `[no random]` | 需在当前目标 PVF 中只读确认 | 不要按整数读取；也不要和 `[item category]` 块内 token 混写。 |
| `[Force Result Item Rule]` | 需在当前目标 PVF 中只读确认 | 可与随机规则语境相邻，但不是固定等同 `[random option]`；数字语义仍需更强证据。 |
| `[hidden option]` | 需在当前目标 PVF 中只读确认 | 不要把 avatar roulette hidden option 或文件名线索写成 equipment 字段事实。 |
| `[item category]` 内 `no random` | 需在当前目标 PVF 中只读确认 | 若后续遇到具体文件，仍需按父块重新核查。 |

## Mystic / Avatar Roulette 字段

| 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `[mystic circle]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[upper]` | 需在当前目标 PVF 中只读确认 | 不等同装备部位 registry；实际可选部位和 UI 仍需实机确认。 |
| `[rare]` | 需在当前目标 PVF 中只读确认 | 稀有度、可洗属性和客户端显示需运行验证。 |
