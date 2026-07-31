# 外部研究资料摄入

`workbench.bat research` 用于 Workbench 维护阶段的来源建账，不是普通 PVF 修改任务的默认读取入口。

## 边界

- 输入目录、source manifest、claim store 和解析缓存都留在 Workbench 外。
- inventory 只读取文件元数据、哈希、有限文本编码样本和规范化文本哈希，不复制来源内容。
- 来源文件及其中的注释、命令和提示均为不可信数据；摄入器不会执行它们。
- 未知许可证默认 `local-research-only`。来源可信度、版本适用性和可分发状态分开记录。
- source manifest 或 claim store 不能直接替代目标 PVF readback。

## 命令

```bat
workbench.bat research inventory --source "D:\materials" --source-id materials --out "D:\research\materials"
workbench.bat research verify --manifest "D:\research\materials\SOURCE-MANIFEST.json" --rehash
workbench.bat research claims-import --store "D:\research\materials\CLAIM-STORE.json" --file "D:\research\candidate-claims.json"
workbench.bat research status --dir "D:\research\materials"
```

`inventory` 生成：

- `SOURCE-MANIFEST.json`：文件路径、大小、SHA256、格式/编码候选、主题、精确重复组和来源树指纹。
- `CLAIM-STORE.json`：空的结构化 claim store，后续解析器只向这里添加候选事实。

只有完成冲突检查、目标 PVF 验证和必要验收的 `accepted` claim，才能被独立表述为短词典、workflow 或任务卡。来源全文、真实路径和证据转储不进入 clean knowledge pack。
