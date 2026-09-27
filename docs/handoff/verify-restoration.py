#!/usr/bin/env python3
"""Verify the complete handoff patch against its Git base without editing the checkout."""

import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def main():
    handoff = Path(__file__).resolve().parent
    repo = handoff.parent.parent
    manifest = json.loads((handoff / "SOURCE-MANIFEST.json").read_text())
    patch = handoff / "patches/editorial-demo.patch"
    if sha256(patch.read_bytes()) != manifest["patch_sha256"]:
        raise SystemExit("FAIL: patch SHA-256 differs from the source manifest")
    archive = subprocess.check_output(
        ["git", "archive", manifest["base_commit"]], cwd=repo
    )
    with tempfile.TemporaryDirectory(prefix="conny-demo-verification-") as temp:
        destination = Path(temp)
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
            for member in tar.getmembers():
                relative = Path(member.name)
                if relative.is_absolute() or ".." in relative.parts:
                    raise SystemExit("FAIL: unexpected archive path")
                target = destination / relative
                if member.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                elif member.isfile():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with tar.extractfile(member) as content:
                        target.write_bytes(content.read())
                    target.chmod(member.mode & 0o777)
                else:
                    raise SystemExit("FAIL: unexpected non-file archive member")
        subprocess.run(
            ["git", "apply", "--check", str(patch)], cwd=destination, check=True
        )
        subprocess.run(["git", "apply", str(patch)], cwd=destination, check=True)
        expected = {entry["path"]: entry for entry in manifest["files"]}
        actual = {
            str(path.relative_to(destination))
            for path in destination.rglob("*")
            if path.is_file()
        }
        if actual != set(expected):
            raise SystemExit("FAIL: reconstructed source file set differs")
        for name, entry in expected.items():
            data = (destination / name).read_bytes()
            if len(data) != entry["bytes"] or sha256(data) != entry["sha256"]:
                raise SystemExit(f"FAIL: reconstructed file differs: {name}")
    print(f"PASS: restored all {len(expected)} source files from {manifest['base_commit']}")
    print("All SHA-256 hashes match. Your working tree was not changed.")


if __name__ == "__main__":
    main()
