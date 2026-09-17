# Bundled font licenses

The frontend ships these unmodified font files inherited from the reference website:

| Font family | Bundled files | License and copyright |
| --- | --- | --- |
| Cormorant Upright | `cormorant-upright-400.woff2`, `cormorant-upright-500.woff2`, `cormorant-upright-600.woff2` | SIL Open Font License 1.1. Copyright 2015 Christian Thalmann and the Cormorant Project Authors. |
| Mansalva | `mansalva-400.woff2` | SIL Open Font License 1.1. Copyright 2019 The Mansalva Project Authors. |

The complete copyright and license texts are copied verbatim from the official Google Fonts repository:

- [Cormorant Upright OFL.txt](https://github.com/google/fonts/blob/c7bbaeb2fbe6d83981585f33ebf46f05e7b95069/ofl/cormorantupright/OFL.txt). Local file `cormorant-upright-OFL.txt`. SHA-256 `9134ca6996bd33ea2022e109f13f20e29dee1dcd8b2e8878aad576d2ca334e9f`.
- [Mansalva OFL.txt](https://github.com/google/fonts/blob/a5784483f71ba1bce0ecb5b2b82ea11713078c01/ofl/mansalva/OFL.txt). Local file `mansalva-OFL.txt`. SHA-256 `14ac0a5413a923c9ad11b6f541df17207fb7a0e0725e43eb29c88eb04c3ea2aa`.

Retrieved September 17, 2026. The frontend's postbuild step copies this directory to `/licenses/fonts/`, alongside the scene notices at `/licenses/scene/`. The publication verifier checks that the build and hosted deployment serve the exact retained notice bytes. Fonts requested from Google Fonts at runtime are not bundled into this deployment.
