import { Color, MeshStandardMaterial, Vector3 } from "three";

/** This projection is calibrated to the baked atlas in conny-bust.glb. */
export function repairConnyEar(material: MeshStandardMaterial) {
  if (!material.map) return;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.connyEarCenter = { value: new Vector3(-0.229, 0.606, -0.013) };
    shader.uniforms.connyEarRadii = { value: new Vector3(0.047, 0.086, 0.059) };
    shader.uniforms.connyEarSkin = { value: new Color("#cfa081") };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vConnySurface;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vConnySurface = position * 0.5 + vec3(0.0, 0.5, 0.0);
      `);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vConnySurface;
        uniform vec3 connyEarCenter;
        uniform vec3 connyEarRadii;
        uniform vec3 connyEarSkin;
      `)
      .replace("#include <map_fragment>", `#include <map_fragment>
        vec3 earOffset = vConnySurface - connyEarCenter;
        earOffset.x += 0.4 * earOffset.y;
        float earWeight = 1.0 - smoothstep(0.82, 1.0, length(earOffset / connyEarRadii));
        if (earWeight > 0.0) {
          vec2 earUv = vec2(
            dot(vec3(0.190712483, 0.090577369, 0.298594839), vConnySurface) + 0.310682946,
            dot(vec3(-0.025580688, 0.354736852, -0.090099072), vConnySurface) + 0.649992558
          );
          vec3 earColor = texture2D(map, earUv).rgb;
          float paleRim = (1.0 - smoothstep(0.05, 0.19, earColor.r - earColor.b))
            * smoothstep(0.2, 0.45, dot(earColor, vec3(0.2126, 0.7152, 0.0722)));
          earColor = mix(earColor, connyEarSkin, paleRim * 0.85);
          diffuseColor.rgb = mix(diffuseColor.rgb, earColor, earWeight);
        }
      `);
  };
  material.customProgramCacheKey = () => "conny-ear-projection-v1";
  material.needsUpdate = true;
}
