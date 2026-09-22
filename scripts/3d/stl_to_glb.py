#!/usr/bin/env python3
"""Turn a raw scan STL into a small Y-up GLB for the /3d tour.

Usage:
    python3 scripts/3d/stl_to_glb.py in.stl out.glb [--faces 40000] [--height 1.0] [--rotate-x 180]

Keeps the largest connected component, decimates with quadric edge
collapse, optionally rotates about x, drops the bust so its lowest point
sits at y=0 with its footprint centered on x and z, and scales the height
to --height units. Pass --rotate-x 180 when the scan is upside down.
Requires trimesh, fast-simplification, numpy, scipy.
"""

import argparse
import sys
import time

import numpy as np
import trimesh


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("src")
    parser.add_argument("dst")
    parser.add_argument("--faces", type=int, default=40000)
    parser.add_argument("--height", type=float, default=1.0)
    parser.add_argument(
        "--rotate-x",
        type=float,
        default=0.0,
        help="degrees to rotate about the x axis before normalizing, 180 for an upside-down scan",
    )
    args = parser.parse_args()

    t0 = time.time()
    mesh = trimesh.load(args.src, force="mesh")
    print(f"loaded {len(mesh.faces)} faces in {time.time() - t0:.1f}s")

    parts = mesh.split(only_watertight=False)
    mesh = max(parts, key=lambda p: len(p.faces))
    print(f"kept largest of {len(parts)} components, {len(mesh.faces)} faces")

    mesh = mesh.simplify_quadric_decimation(face_count=args.faces)
    mesh.remove_unreferenced_vertices()
    mesh.merge_vertices()
    print(f"decimated to {len(mesh.faces)} faces, {len(mesh.vertices)} vertices")

    if args.rotate_x:
        mesh.apply_transform(
            trimesh.transformations.rotation_matrix(np.radians(args.rotate_x), [1, 0, 0])
        )

    lo, hi = mesh.bounds
    center = np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])
    mesh.apply_translation(-center)
    mesh.apply_scale(args.height / (hi[1] - lo[1]))
    mesh.fix_normals()
    print(f"bounds after normalize {mesh.bounds.round(3).tolist()}")

    mesh.export(args.dst, include_normals=True)
    print(f"wrote {args.dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
