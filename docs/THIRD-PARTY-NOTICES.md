# Third-party runtime notices

The Workbench's own code is distributed under the root `LICENSE`. The clean
knowledge pack is covered separately by `LICENSE-KNOWLEDGE-CC0.md`.

## Node.js

`runtime/node/node.exe` is the official 64-bit Windows executable from Node.js
v24.18.1. Its complete upstream license and bundled dependency notices are
preserved verbatim in `runtime/node/LICENSE`. The exact archive and executable
hashes are pinned in `release/BUNDLED-RUNTIME-MANIFEST.json`.

## PVF native backend

`tools/pvf-bridge/native/pvf_rust_core.node` is a precompiled 64-bit Windows
Node-API component distributed in the public `PVF X-Pilot 2.0.11` win32-x64
extension package by publisher `DOF`. The package identifies its license as
MIT and carries the copyright line `Copyright © Chadnaut and contributors`.
The original package license is preserved verbatim in
`docs/licenses/PVF-X-PILOT-MIT.txt`. The component is unsigned. Its exact hash,
size, package identity, and package hash are pinned in
`release/BUNDLED-RUNTIME-MANIFEST.json`. The Workbench prefers this component
for full read/write capability; its integrity remains mandatory even though a
separate read-only fallback can preserve inspection when the component cannot
be loaded on a target machine.

The corresponding Rust source tree, `Cargo.toml`, and `Cargo.lock` are not
present in this release. Therefore this repository cannot currently provide a
reproducible source build or a complete source-derived dependency-license
report for that component. The repository URL declared by the extension
package was unavailable during the release audit. Embedded build paths reveal
the following direct or transitive crate/version candidates; this list is
diagnostic and is not a substitute for a recovered lockfile:

`aho-corasick 1.1.4`, `anyhow 1.0.102`, `base64 0.22.1`, `byteorder 1.5.0`,
`chrono 0.4.44`, `crossbeam-deque 0.8.6`, `crossbeam-epoch 0.9.18`,
`encoding_rs 0.8.35`, `ferrous-opencc 0.3.1`, `fst 0.4.7`, `itoa 1.0.18`,
`memchr 2.8.0`, `napi 3.8.4`, `napi-sys 3.2.1`, `phf 0.13.1`,
`phf_shared 0.13.1`, `rayon 1.11.0`, `rayon-core 1.13.0`, `regex 1.12.3`,
`regex-automata 0.4.14`, `regex-syntax 0.8.10`, `serde_json 1.0.149`,
`tokio 1.51.0`, `uuid 1.23.0`, `walkdir 2.5.0`, `winapi-util 0.1.11`, and
`zstd-safe 7.2.4`.

The native component imports `VCRUNTIME140.dll` and Windows system libraries.
The Workbench does not bundle Microsoft DLLs or an installer. A machine without
a compatible Microsoft Visual C++ v14 runtime will make `workbench.bat check`
report a degraded read-only state and select the bundled JavaScript fallback.
No external plugin is used, and all PVF writes remain unavailable. Use Microsoft's
[latest supported Visual C++ Redistributable page](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
and select the official x64 package; the Workbench never downloads or installs
it automatically. `workbench.bat runtime-help --open` opens the official
instructions, and non-automated interactive `workbench.bat check` also opens
that page after an integrity-verified native load failure. Automated and Agent
runs print the official page and x64 permalink without opening a browser.

## JavaScript read-only fallback

The fallback under `tools/pvf-bridge/fallback/` is a dependency-free adaptation
of PVF parsing concepts from a privately supplied TypeScript PVF parser. The
user represented that the original author explicitly authorized unrestricted
use for this Workbench. The VSCode extension, its UI, save workflow, and bundled
dependencies are not redistributed here. The fallback implementation is part
of the Workbench code under the root MIT license and intentionally exposes no
PVF save path.
