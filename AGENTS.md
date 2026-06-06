# Land2 ERP - Graphify Knowledge Graph

This project has a graphify knowledge graph at `graphify-out/`.

## Rules
1. **Before answering architecture or codebase questions**, read `graphify-out/GRAPH_REPORT.md` for context — god nodes, community structure, key files.
2. **For codebase questions** (how X works, what calls Y, trace data flow), run `graphify query "<question>"` — answers from the graph without reading raw files. Huge token savings.
3. **To find relevant files for a new feature**, query the graph first: `graphify query "what pattern do <similar feature> pages follow?"`
4. **After modifying code**, run `graphify update .` to keep the graph current (AST-only, costs 0 API tokens). Use `graphify-out/build_graph.py` if `graphify` CLI fails (Windows multiprocessing workaround).

## Quick Reference
```bash
cd /c/Users/khamis/Documents/land2
graphify query "How does X work?"
graphify query "What imports does Y use?"
graphify query "Find all components related to Z"
graphify update .        # after code changes
```

## Graph Stats (last build)
- 1968 nodes, 2136 edges, 254 communities
- AST only — no API cost to build or maintain
- Key hubs: `useLocale()` (171 connections), `stores.ts` (105), `DashboardComponents.tsx` (39)

## Updating
Run from project root:
```bash
/c/Users/khamis/AppData/Roaming/uv/tools/graphifyy/Scripts/python.exe graphify-out/build_graph.py
```
