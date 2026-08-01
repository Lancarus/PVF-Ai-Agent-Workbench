# 高级兼容命令

这些 bat 是 `workbench.bat` 的底层兼容入口，保留给已有自动化和高级排错使用。

普通用户和 Agent 默认只使用根目录：

```bat
workbench.bat help
```

新增公开命令时，应先扩展 `core/pvf-agent-core/scripts/workbench.js`，再决定是否需要新的兼容 wrapper。

当前 `nut-source` 只通过根目录 `workbench.bat nut-source ...` 暴露，不提供额外兼容 wrapper。
