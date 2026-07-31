# DNF PVF Agent Instructions

You are working inside a clean PVF-Agent-Workbench folder. This is a task workspace, not the development roadmap workspace.

## Default Workflow

1. Read `AGENTS.md`.
2. Read `README.zh-CN.md`.
3. Read `knowledge-pack/README.zh-CN.md`.
4. Read `knowledge-pack/safety/README.zh-CN.md`.
5. Read `knowledge-pack/indexes/knowledge-index.json`.
6. Use the bundled `workbench.bat` lane; it is the complete ordinary-task runtime.
7. Open only the routed task card, dictionary, workflow, or encyclopedia entry named by the knowledge index.
8. Inspect the target PVF with read-only commands before proposing edits.
9. For write tasks, produce a controlled-output plan before any apply.

## Capability Lane

Use `workbench.bat pvf-read`, `workbench.bat pvf-index`, and `workbench.bat pvf-change`. The Workbench carries both its preferred native backend and a JavaScript read-only fallback, so ordinary inspection is self-contained. If a session reports `readOnly: true`, continue only with reads/dry-run and block backup/apply/write until `workbench.bat check` confirms native is available. Use bundled `knowledge-query nut`, `knowledge-query tag`, and `knowledge-query bookmark` for foundational knowledge.

When a task explicitly supplies a source/claim artifact, lineage, dependency report, or client matrix, use `workbench.bat knowledge-query` for narrow lookups. Preserve artifact SHA and evidence boundaries; zero matches are not proof of absence.

## Allowed By Default

- Check this folder with `workbench.bat check`.
- Read, list, search, and resolve `.lst` IDs in a user-provided PVF.
- Build local read-only indexes in the external Workbench runtime directory.
- Validate and dry-run change-sets.
- Summarize exact target files, IDs, risks, and remaining in-game tests.

## Not Allowed By Default

- Do not overwrite source PVF files.
- Do not modify client files.
- Do not copy API keys, real PVFs, clients, indexes, or reports into this folder.
- Do not use tutorial numbers or community notes as write authority without target-PVF verification.
- Do not read all evidence or candidate files by default.

## Write Requirements

PVF writes require explicit user authorization and must use the controlled-output path:

- Confirm the exact target PVF.
- Resolve relevant IDs through the correct `.lst`.
- Build exact replacement text from target raw no-simplified readback and make the smallest edit.
- Require a matching unblocked dry-run manifest for the same source PVF and same change-set, plus its approval code.
- Create a timestamped backup.
- Save to an explicit output PVF that is not the source.
- Reopen/read back the output.
- Produce a manifest and concise change summary.

Client resource writes require a separate explicit authorization and are outside normal PVF write permission.
