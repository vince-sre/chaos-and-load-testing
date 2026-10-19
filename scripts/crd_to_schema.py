#!/usr/bin/env python3
"""Convert CustomResourceDefinitions into kubeconform JSON schemas.

The public CRDs catalog has no Chaos Mesh schemas, so CI downloads the CRD
bundle for the pinned Chaos Mesh version and generates them:

    python3 scripts/crd_to_schema.py crd.yaml .schemas
    kubeconform -schema-location '.schemas/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' chaos/

additionalProperties is set to false on every object that declares
properties, so typos in spec fields fail validation (like kubeconform -strict).
"""
import json
import pathlib
import sys

import yaml


def strictify(node):
    if isinstance(node, dict):
        if node.get("type") == "object" and "properties" in node and "additionalProperties" not in node:
            node["additionalProperties"] = False
        for value in node.values():
            strictify(value)
    elif isinstance(node, list):
        for value in node:
            strictify(value)
    return node


def main(src: str, out_dir: str) -> int:
    out = pathlib.Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    count = 0
    with open(src, encoding="utf-8") as fh:
        for doc in yaml.safe_load_all(fh):
            if not doc or doc.get("kind") != "CustomResourceDefinition":
                continue
            kind = doc["spec"]["names"]["kind"].lower()
            for version in doc["spec"]["versions"]:
                schema = version.get("schema", {}).get("openAPIV3Schema")
                if not schema:
                    continue
                path = out / f"{kind}_{version['name']}.json"
                path.write_text(json.dumps(strictify(schema), indent=1), encoding="utf-8")
                count += 1
    print(f"wrote {count} schemas to {out}")
    return 0 if count else 1


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(f"usage: {sys.argv[0]} <crd.yaml> <out-dir>")
    sys.exit(main(sys.argv[1], sys.argv[2]))
