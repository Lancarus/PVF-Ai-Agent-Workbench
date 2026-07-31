不能绕过。普通 `pvf-read` 通道只公开读取操作；即使 bundled backend 内部有写入实现，也只能由 `workbench.bat pvf-change apply` 的受控 runner 调用，并且必须提供匹配的 dry-run manifest 和 approval code。禁止直接调用 `pvf_write_file`。
