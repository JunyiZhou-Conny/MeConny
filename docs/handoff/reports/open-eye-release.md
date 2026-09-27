# Open-eye portrait production release

Conny explicitly selected the open-eye preview for the public website. The release preserves the reviewed runtime/model and fixes the calibrator's existing-output overwrite defect.

- PR https://github.com/JunyiZhou-Conny/MeConny/pull/14.
- Reviewed release head f788854dc5a34a1656723b6259c1b14e594bb615.
- Base611b0970c416cd235afbe8612a2e8e30c4a13b59.
- Stable patch0f9746a3823e470b15c9ed0952155ce3d4211e28.
- Independent release verdict PASS+NOTES https://github.com/JunyiZhou-Conny/MeConny/pull/14#issuecomment-5718490909.
- Bugbot output-overwrite finding4039572692 fixed, replied, and resolved. Eight negative checks and byte-identical model reproduction passed.
- Vercel, Bugbot, and Vercel Preview Comments allpassed at merge; PR wasCLEAN/MERGEABLE with exact head/base/patch verified. GitHub CLI wasused because Origin wasunavailable. No queuewasarmed andno unrelatedPRwasmerged.
- Squash62749f90f3ff1af836366c1a2f2361e4f264f8a5, merged2026-09-17T17:22:44Z. Its tree matches reviewedf788854 exactly.
- Production GitHub deployment6508335903 succeeded2026-09-17T17:23:15Z.
- Production https://me-conny-9umujg99p-junyizhou-conny.vercel.app.
- Vercel build https://vercel.com/junyizhou-conny/me-conny/2RuS3ycz6eHNABiyu3aCK6NYCGiT.
- Live model SHA168a2c2bef0b549a86a5e906647dfdd62fc572863e5474af532815b09fba1f01.
- Local build/lint/30artifactchecks passed. Public72HTTP/assets/routeschecks passed; apex308→www preserved. Live browser visuallyconfirmed the openeyes,cheekstickers,andpeacepose.
- Full public browser suite passed169/169checks acrossdesktop1440×900,phone390×844,andcompactphone375×667, withzero runtimeerrors/failedrequests. Evidence outputs/live-site-next/portrait-production/results.json and33screenshots. The publicsite serves theapprovedmodel andallpanels/scrollinteractions work.

Rollback identity: previousmain611b097, GitHub productiondeployment6506968498, https://me-conny-dc6zqd4vb-junyizhou-conny.vercel.app. Prior winkGLB SHA c4f68c6670534f528d2c663cf4cc0100c8f84c4803b2f28d435e92f8e237a7f7. No rollbackwasneeded.

Poteto principles applied. Fix Root Causes required rejecting existing outputpaths at the calibrator writeboundary. Prove It Works required byte-identical reproduction, the independent release review, and public-domain verification.
