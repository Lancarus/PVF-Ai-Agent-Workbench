# Client UI Layout / `.ui` / `.pos` / `.lay` 字段词典

状态：默认可用


## 文件族

| 文件族 | 目标核验 | 读取边界 |
| --- | --- | --- |
| `.ui` | 需在当前目标 PVF 中只读确认 | 证明控件描述存在，不证明客户端图片、窗口、点击、输入、拖拽、文本显示或服务端流程正常。 |
| `.pos` | 需在当前目标 PVF 中只读确认 | 跨版本候选；需在当前目标 PVF 中复核 |
| `.lay` | 需在当前目标 PVF 中只读确认 | 证明角色 motion 模板存在；`%s` 路径不是具体资源路径。 |
| `clientonly/skilltree/*.co` | 需在当前目标 PVF 中只读确认 | 只说明图标位置和前置线索，不证明技能可学或 UI 可点。 |

## `.ui` 常见块

| 字段 / 结构 | 目标核验 | 静态含义 | 不证明 |
| --- | --- | --- | --- |
| `[window] ... [/window]` | 需在当前目标 PVF 中只读确认 | 窗口式 UI 外层块。 | 窗口一定弹出、置顶、可关闭或可操作。 |
| `[type]` | 需在当前目标 PVF 中只读确认 | 窗口类型线索。 | 客户端弹窗逻辑或服务端放行。 |
| `[horizontal alignment]` / `[vertical alignment]` | 需在当前目标 PVF 中只读确认 | 窗口对齐线索。 | 最终屏幕位置、分辨率适配或缩放正确。 |
| `[horizontal distance]` / `[vertical distance]` | 需在当前目标 PVF 中只读确认 | 窗口偏移数值。 | 实机坐标系、DPI、窗口锚点准确。 |
| `[size]` | 需在当前目标 PVF 中只读确认 | 窗口尺寸样数字。 | 实际像素宽高或内容不溢出。 |
| `[title string]` | 需在当前目标 PVF 中只读确认 | 标题文本或 StringLink 样 token。 | 字体、换行、编码、翻译或 UI 显示正常。 |
| `[controls] ... [/controls]` | 需在当前目标 PVF 中只读确认 | 控件集合块。 | 子控件事件绑定或客户端逻辑完整。 |
| `[ui controls] ... [/ui controls]` | 需在当前目标 PVF 中只读确认 | 单个 UI 控件描述块。 | 控件可见、可点、事件生效或资源齐全。 |

## 控件类型

| 控件 token | 目标核验 | 静态含义 | 不证明 |
| --- | --- | --- | --- |
| `` `[image]` `` | 需在当前目标 PVF 中只读确认 | 图片控件，常带坐标、模式、IMG 路径、帧号样数字。 | IMG/NPK 存在、帧号正确或渲染正常。 |
| `` `[button]` `` | 需在当前目标 PVF 中只读确认 | 按钮控件，常带位置、图片、按下帧组。 | 点击事件、冷却、领取、确认或取消成功。 |
| `` `[text button]` `` | 需在当前目标 PVF 中只读确认 | 带文本按钮，可见 StringLink 或直接文本。 | 文本显示、按钮响应或服务端流程。 |
| `` `[control]` `` | 需在当前目标 PVF 中只读确认 | 基础控制容器或占位控件。 | 具体交互语义，需结合父块和客户端。 |
| `` `[control group]` `` | 需在当前目标 PVF 中只读确认 | 可配合 `[ui path]` 引入子 UI。 | 子 UI 一定加载成功。 |
| `` `[board image]` `` | 需在当前目标 PVF 中只读确认 | 面板/九宫格类图片描述。 | 边框拉伸或皮肤显示正确。 |
| `` `[text]` `` | 需在当前目标 PVF 中只读确认 | 文本控件，常带字体/宽度/颜色样数字。 | 字体、换行、溢出、乱码或翻译正确。 |
| `` `[animation]` `` | 需在当前目标 PVF 中只读确认 | 动画控件，引用 `.ani`。 | ANI 资源存在、帧号有效或播放正常。 |
| `` `[hyperlinklabel]` `` | 需在当前目标 PVF 中只读确认 | 超链接样文本控件，可带 `[user option]` 的 URL。 | 链接能打开或活动页可访问。 |
| `` `[checkbox]` `` / `` `[radiobutton]` `` | 需在当前目标 PVF 中只读确认 | 勾选/单选控件描述。 | 状态保存、筛选、分页或服务端逻辑。 |
| `` `[tab group]` `` | 需在当前目标 PVF 中只读确认 | tab 分组描述。 | 标签页切换、内容刷新或焦点正确。 |
| `` `[grid]` `` | 需在当前目标 PVF 中只读确认 | 网格控件，样本含 `[grid data]`、`[cell basic data]`、`[cell margin]`。 | 背包容量、格子解锁、拖拽、堆叠或物品移动。 |
| `` `[gauge]` `` | 需在当前目标 PVF 中只读确认 | 条形/进度控件。 | 数值刷新、颜色、动画或数据来源正确。 |
| `` `[tree]` `` | 需在当前目标 PVF 中只读确认 | 树形列表控件。 | 展开、选择、数据加载或排序正常。 |
| `` `[tooltips]` `` | 需在当前目标 PVF 中只读确认 | 提示文本控件，可挂到 tab/radio。 | 鼠标悬停、位置、换行或遮挡正常。 |

## 关系与选项

| 字段 / 结构 | 目标核验 | 静态含义 | 不证明 |
| --- | --- | --- | --- |
| `[parent]` | 需在当前目标 PVF 中只读确认 | 当前控件挂到父控件名/编号。 | 父子显示顺序或事件冒泡正确。 |
| `[parent tab]` | 需在当前目标 PVF 中只读确认 | 当前控件挂到 tab group 的某个 tab。 | tab 点击后一定切换显示。 |
| `[parent radio]` | 需在当前目标 PVF 中只读确认 | 当前控件挂到 radio 的某个选项。 | 选项状态与提示同步。 |
| `[ui path]` | 需在当前目标 PVF 中只读确认 | 引用另一个 `.ui` 文件并绑定父控件。 | 子 UI 一定存在、加载或布局正确。 |
| `[common action]` | 需在当前目标 PVF 中只读确认 | 绑定公共 `.act` 路径。 | 动作播放、按钮反馈或动画资源完整。 |
| `[int option]` | 需在当前目标 PVF 中只读确认 | 控件整数选项块，样本含 button down image offset、grid/cell 参数、line height 等。 | 选项名全部语义已明、客户端采用或显示正确。 |
| `[user option]` | 需在当前目标 PVF 中只读确认 | 用户/文本/URL 类选项块。 | URL 可访问、文本点击或活动跳转成功。 |
| `[variable]` | 需在当前目标 PVF 中只读确认 | UI 内部变量描述。 | 运行时变量值、保存和刷新逻辑。 |

## `.pos` 观察边界


| 字段 | 辅助样本形状 | 目标核验 |
| --- | --- | --- |
| `[MAIN]` | 外层主块。 | 需在当前目标 PVF 中只读确认 |
| `[TILETYPE]` | `COMMON`。 | 需在当前目标 PVF 中只读确认 |
| `[POS]` | 两个数值。 | 需在当前目标 PVF 中只读确认 |
| `[UNITNUMBER]` | 两个数值。 | 需在当前目标 PVF 中只读确认 |
| `[UIDATA]` + `[INDEX]` + `[POS]` | 多段子位置数据。 | 需在当前目标 PVF 中只读确认 |

## `.lay` motion 模板

| 字段 / 结构 | 目标核验 | 静态含义 | 不证明 |
| --- | --- | --- | --- |
| `[LAYER]` | 需在当前目标 PVF 中只读确认 | 层编号或层入口。 | 客户端最终层级、遮挡或换装显示正确。 |
| `[waiting motion]`、`[move motion]`、`[jump motion]` 等 | 需在当前目标 PVF 中只读确认 | 基础动作 motion 模板。 | 具体 ANI 资源存在或动作播放正常。 |
| `[attack motion] ... [/attack motion]` | 需在当前目标 PVF 中只读确认 | 普通攻击 motion 列表。 | 攻击段数、hitbox、手感或取消窗口。 |
| `[etc motion] ... [/etc motion]` | 需在当前目标 PVF 中只读确认 | 职业特殊动作列表。 | 技能脚本能调用、资源完整或实机帧窗口。 |

## 数字 ID 规则

| 父块 | 正确处理 |
| --- | --- |
| `.wdm [dungeon]` | 按 `dungeon/dungeon.lst` 解析。样本 `3` 是 `dungeon/Act1/MirkWood.dgn`，`503` 是 `dungeon/quest/deadmoon.dgn`，`1000` 是 `dungeon/Act1/SunderLandDark.dgn`。 |
| worldmap `.ui` 的 balloon 末列 dungeon 样数字 | 结合对应 `.wdm [dungeon]` 和 `dungeon/dungeon.lst` 复核。 |
| `clientonly/skilltree/* [index]` | 按对应职业技能 `.lst` 解析，不存在通用 `skill/skill.lst`。样本 `swordman_sp.co` 的 `173` 走 `skill/swordmanskill.lst`。 |
| `.ui` 坐标、帧号、控件编号、颜色、宽高、tab index、grid cell 参数 | 不按物品、任务、装备、NPC 或全局 ID 猜测。 |
| `-1`、`0`、短数字控件名 | 只按父块记录为控制值、空位、坐标、编号或模式线索。 |
