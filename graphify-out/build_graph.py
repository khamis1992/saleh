#!/usr/bin/env python3
"""Build graphify knowledge graph for land2 project (AST-only, no API key needed)."""
import json
import sys
import multiprocessing
from pathlib import Path

# Fix Windows multiprocessing spawn issue
if __name__ != "__main__":
    # Allow running as module
    pass

def main():
    # Ensure we're using spawn context
    ctx = multiprocessing.get_context("spawn")
    
    from graphify.detect import detect
    from graphify.extract import collect_files, extract
    from graphify.build import build_from_json
    from graphify.cluster import cluster, score_all
    from graphify.analyze import god_nodes, surprising_connections, suggest_questions
    from graphify.report import generate
    from graphify.export import to_json

    project_root = Path(__file__).resolve().parent.parent
    os.chdir(str(project_root))
    
    # Step 1: Detect all files
    result = detect(project_root)
    Path("graphify-out/.graphify_detect.json").write_text(
        json.dumps(result, ensure_ascii=False), encoding="utf-8"
    )
    Path("graphify-out/.graphify_root").write_text(
        str(project_root.resolve()), encoding="utf-8"
    )
    print(f"Corpus: {result['total_files']} files, ~{result['total_words']} words")
    files = result.get("files", {})
    for k, v in files.items():
        if v:
            print(f"  {k}: {len(v)} files")

    # Step 2: AST extraction (code files only, no API key needed)
    code_files = []
    for f in files.get("code", []):
        code_files.extend(
            collect_files(Path(f)) if Path(f).is_dir() else [Path(f)]
        )

    if code_files:
        # Use single process to avoid Windows multiprocessing spawn issues
        ast_result = extract(code_files, cache_root=project_root, max_workers=1)
        Path("graphify-out/.graphify_ast.json").write_text(
            json.dumps(ast_result, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"AST: {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges")
    else:
        Path("graphify-out/.graphify_ast.json").write_text(
            json.dumps({"nodes": [], "edges": [], "input_tokens": 0, "output_tokens": 0}),
            ensure_ascii=False,
        )
        print("No code files - skipping AST extraction")

    # Step 3: Merge (AST only, no semantic since no API key)
    ast = json.loads(Path("graphify-out/.graphify_ast.json").read_text(encoding="utf-8"))
    merged = {
        "nodes": list(ast["nodes"]),
        "edges": list(ast["edges"]),
        "hyperedges": [],
        "input_tokens": 0,
        "output_tokens": 0,
    }
    Path("graphify-out/.graphify_extract.json").write_text(
        json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Merged: {len(merged['nodes'])} nodes, {len(merged['edges'])} edges (AST only)")

    # Step 4: Build graph, cluster, analyze
    G = build_from_json(merged)
    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {"input": 0, "output": 0}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: f"Community {cid}" for cid in communities}
    questions = suggest_questions(G, communities, labels)

    report = generate(
        G, communities, cohesion, labels, gods, surprises, result, tokens,
        str(project_root), suggested_questions=questions
    )
    Path("graphify-out/GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    to_json(G, communities, "graphify-out/graph.json")

    analysis = {
        "communities": {str(k): v for k, v in communities.items()},
        "cohesion": {str(k): v for k, v in cohesion.items()},
        "gods": gods,
        "surprises": surprises,
        "questions": questions,
    }
    Path("graphify-out/.graphify_analysis.json").write_text(
        json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")
    print("Done! Output in graphify-out/")

if __name__ == "__main__":
    import os
    main()
