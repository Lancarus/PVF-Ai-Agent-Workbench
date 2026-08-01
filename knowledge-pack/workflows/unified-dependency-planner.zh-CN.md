# 统一依赖 Planner 只读流程

状态：默认可用

## 适用

用于在目标 PVF 内预览一个副本、城镇、怪物、PassiveObject、APC、ANI、装备、stackable、礼包、宝珠、任务或套装的 registry-aware 依赖图。

## 输入

- 明确的目标 `Script.pvf`。
- 一个 domain。
- ID、PVF path、query 或受支持 sample 中恰好一个选择器。
- 外部输出目录；真实 PVF、路径、raw artifact 和报告不得进入 clean Workbench。

批量 profile 必须保存并校验目标 PVF 的完整 SHA256。缓存复用必须同时匹配 PVF SHA、完整请求和底层 planner lane；不匹配时重新只读生成，不能借用旧 raw artifact。

## 执行

1. 先读快速边界，确认任务只是依赖预览。
2. 用 `dependency-plan plan` 运行单项；需要跨域回归时再使用 SHA 锁定的私有 batch profile。
3. 核对 `rootCount == 1`；数字 root 必须由 domain 对应 registry 解析。
4. 核对 `readErrorCount == 0`；任何读错误都使闭包不完整。
5. 逐项审阅 resolved edge、registry evidence 与 underlying raw readback。
6. 分类 `unresolved`：缺文件、错 registry、未支持 tag、跨系统引用或客户端资源风险；不得为全绿而删除。
7. 把 `clientAssetCandidates` 只当作后续只读客户端检查输入，不写成资源存在事实。
8. 确需改动时，从目标 PVF 重新取 raw no-simplified 精确文本和最近邻样本，另建受控 change-set。

## 命令

```bat
workbench.bat dependency-plan plan --pvf "D:\target\Script.pvf" --domain dungeon --id 11 --out "D:\research\dependency-plans"
workbench.bat dependency-plan plan --pvf "D:\target\Script.pvf" --domain package --path "stackable/cash/package.stk" --out "D:\research\dependency-plans"
workbench.bat dependency-plan batch --profile "D:\research\PRIVATE-DEPENDENCY-PLANNER-PROFILE.json" --out "D:\research\dependency-batch"
```

`--reuse-raw` 只复用具有匹配 binding metadata 的缓存，不是跳过 PVF SHA 或请求校验的开关。

## 验收

- root 唯一，读取错误为 0。
- resolved 和 unresolved 都可追到来源路径、目标路径/ID 与 registry 证据。
- 报告明确 `readOnly=true`、未写 PVF、未写客户端、未生成 apply patch。
- 客户端资源候选与客户端存在性、运行时正确性分层。
- 后续写入只通过 `workbench.bat pvf-change` 的受控生命周期。

