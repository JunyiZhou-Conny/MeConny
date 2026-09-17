import argparse
import json
import sys
from pathlib import Path

import bpy
import numpy as np


def smoothstep(low, high, value):
    t = np.clip((value - low) / (high - low), 0, 1)
    return t * t * (3 - 2 * t)


parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
args.output.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(args.source.resolve()))
parts = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if len(parts) != 1:
    raise ValueError("Preparation expects the single textured mesh from the simplification stage")
body = parts[0]
bpy.context.view_layer.objects.active = body
body.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
mesh = body.data
positions = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
mesh.vertices.foreach_get("co", positions)
positions = positions.reshape(-1, 3)
minimum, maximum = positions.min(axis=0), positions.max(axis=0)
height = maximum[2] - minimum[2]
positions -= (minimum + maximum) / 2
positions /= height
positions[:, 2] += 0.5
mesh.vertices.foreach_set("co", positions.ravel())
mesh.update()

image = next(node.image for node in body.active_material.node_tree.nodes if node.type == "TEX_IMAGE")
pixels = np.empty(image.size[0] * image.size[1] * 4, dtype=np.float32)
image.pixels.foreach_get(pixels)
pixels = pixels.reshape(image.size[1], image.size[0], 4)
uvs = np.empty(len(mesh.loops) * 2, dtype=np.float32)
mesh.uv_layers.active.data.foreach_get("uv", uvs)
uvs = uvs.reshape(-1, 3, 2).mean(axis=1)
colors = pixels[(uvs[:, 1] * (image.size[1] - 1)).astype(int), (uvs[:, 0] * (image.size[0] - 1)).astype(int), :3]
triangle_indices = np.empty(len(mesh.loops), dtype=np.int32)
mesh.loops.foreach_get("vertex_index", triangle_indices)
centers = positions[triangle_indices.reshape(-1, 3)].mean(axis=1)

roles = [
    ("ConnySkin", 0.70),
    ("ConnyHair", 0.68),
    ("ConnyShirt", 0.91),
]
mesh.materials.clear()
for name, roughness in roles:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0
    texture = material.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = image
    material.node_tree.links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    mesh.materials.append(material)
cloth = (colors[:, 2] > colors[:, 0] * 1.12) & (colors[:, 2] > colors[:, 1] * 1.06) & (centers[:, 2] < 0.56)
hair = (colors.max(axis=1) < 0.23) & (centers[:, 2] > 0.57) & (-centers[:, 1] < 0.19)
material_indices = np.where(cloth, 2, np.where(hair, 1, 0))
mesh.polygons.foreach_set("material_index", material_indices)

armature = bpy.data.armatures.new("ConnyRig")
rig = bpy.data.objects.new("ConnyRig", armature)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
body.select_set(False)
rig.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
root = armature.edit_bones.new("Root")
root.head, root.tail = (0, 0, 0), (0, 0, 0.1)
head = armature.edit_bones.new("Head")
head.head, head.tail = (0.04, 0.02, 0.48), (0.04, 0.02, 0.68)
head.parent = root
bpy.ops.object.mode_set(mode="OBJECT")
head_weights = smoothstep(0.46, 0.59, positions[:, 2]) * (1 - smoothstep(0.18, 0.235, -positions[:, 1]))
head_weights[np.unique(triangle_indices.reshape(-1, 3)[cloth])] = 0
body_group = body.vertex_groups.new(name="Root")
head_group = body.vertex_groups.new(name="Head")
for index, weight in enumerate(head_weights):
    body_group.add([index], float(1 - weight), "REPLACE")
    head_group.add([index], float(weight), "REPLACE")
modifier = body.modifiers.new("ConnyRig", "ARMATURE")
modifier.object = rig
body.parent = rig

rig.select_set(False)
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="MATERIAL")
bpy.ops.object.mode_set(mode="OBJECT")
for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        obj.name = obj.data.materials[0].name
        obj.data.name = obj.name
        obj["materialRole"] = obj.name.removeprefix("Conny").lower()
for name, point in {
    "focus_face": (0.04, 0.75, 0.08),
    "focus_torso": (0.06, 0.29, 0.04),
    "focus_hand": (-0.23, 0.52, 0.29),
}.items():
    anchor = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(anchor)
    anchor.location = (point[0], -point[2], point[1])
rig["characterVersion"] = "conny-wink-v1"
rig["expression"] = "authored wink and peace sign"
image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str((args.output / "conny-character.blend").resolve()), compress=True)
bpy.ops.export_scene.gltf(
    filepath=str((args.output / "conny-character.glb").resolve()),
    export_format="GLB",
    export_animations=False,
    export_skins=True,
    export_extras=True,
    export_image_format="AUTO",
    export_yup=True,
    export_meshopt_compression_enable=True,
    export_meshopt_extension="EXT_meshopt_compression",
)
report = {
    "vertices": len(positions),
    "triangles": len(material_indices),
    "materials": {name: int(np.count_nonzero(material_indices == i)) for i, (name, _) in enumerate(roles)},
    "headWeightedVertices": int(np.count_nonzero(head_weights)),
    "peaceHandMaxHeadWeight": float(head_weights[(-positions[:, 1] > 0.235) & (positions[:, 2] > 0.42)].max(initial=0)),
    "eyeMotion": False,
    "blink": False,
    "headPivotGltf": [0.04, 0.48, -0.02],
}
(args.output / "rig-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report))
