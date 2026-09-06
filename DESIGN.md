# Ma'ahad An-Najah Putri Company Profile

## Design read

An informational company profile for families and the community, introducing a Sunnah-based, girls-only Ma'ahad. No registration or admissions funnel is in scope. The approved revision uses an airy blue-white canvas, navy typography, and restrained gold accents. The signature is a centered-logo arrival followed by an interactive photographic hero.

## Design dials

- DESIGN_VARIANCE: 8. Photographic hero, arched introduction, tabbed education, facility overview, asymmetric gallery, featured-news composition, and a sticky daily-life narrative.
- MOTION_INTENSITY: 7. A brief branded arrival, pointer and scroll parallax, restrained reveals, and accessible dialogs. Informational sections remain calm.
- VISUAL_DENSITY: 4. Generous spacing with concise content and strong information hierarchy.

## Visual system

- Light canvas: `#f5f8fc`
- Light secondary surface: `#eaf1f9`
- Light elevated surface: `#fcfdff`
- Navy text: `#071a3d`
- Gold text accent: `#89601c`
- Gold button fill: `#dfba68`
- Hero photographic treatment: navy `#071a3d` blended through royal blue into the existing photo, with off-white `#f5f7fb` text, muted blue-white `#c3d0e5`, and gold `#f0cf83`. This user-requested treatment is unchanged by the page theme; no white gradient is used in the hero, including on mobile.
- Dark counterparts: navy `#061633`, midnight `#030d21`, royal-blue surface `#0a214b`, gold `#d8ae57`, bright gold `#f0cf83`.
- Shape rule: 22px media and content surfaces, pill-shaped CTAs, circular signature controls.
- Typography: platform-native variable sans stacks with strong display weight and compact body copy.
- Theme: light by default, with an icon-only moon/sun toggle. Explicit choices persist under `annajah-theme-v3`. The old revision's theme key is intentionally not reused. Dark media overlays are photographic readability treatments, not independent section themes.
- Z-index: content 0, header 40, splash 90, skip link 100. Dialogs use the browser's native top layer.

## Revision audit and information architecture

- Preserve: logo, Sunnah-centered voice, girls-only niqab imagery, gallery lightbox, video-player fallback, tab keyboard behavior, and reduced-motion support.
- Retire: admissions CTAs, registration section, text-only theme controls, dark-first presentation, and numbered decorative principle labels.
- Primary paths: learn about the Ma'ahad, explore education and facilities, read activities, view the gallery, consult FAQ, and contact the institution.
- Navigation: Tentang, Pendidikan, Fasilitas, Galeri, Kegiatan, FAQ, and Hubungi Kami. Footer and mobile menu additionally expose Media Sosial.
- Education explains diniyah and Al-Quran, general subjects, and personal development. Subject examples remain subject to curriculum verification.

## Signature interactions

- Navigation is fully transparent at the page top, with off-white labels and gold accents. After approximately 25px of scrolling, a theme-aware frosted surface fades/slides in over 400ms without moving the controls. An IntersectionObserver watches a 1px sentinel, not the hero's visibility ratio, so short screens and tall hero content remain correct. Returning to the top reverses the transition. Reduced motion removes the transition; reduced transparency, disabled JavaScript, and older browsers receive a solid readable fallback.
- Document opening/refresh: a full-screen navy-blue splash presents the official logo in a white medallion, framed by two distinct gold botanical compositions. Branches draw from the left-bottom and right-top edges, filled leaves unfold in sequence, four flowers bloom, and six small petals drift at different depths. After the first growth phase, the logo and name enter independently without bounce or dramatic scaling; the completed plants continue a slow asymmetric sway. It stays for 2.7 seconds (up to 3.1 seconds for slow hero media), then fades/lifts by 6px with a subtle 0.8% scale over 740ms. Only after the exit is the main page unlocked and its entrance played. In-page links never replay the splash. Reduced motion skips it, including when enabled while loading; a 4.6-second watchdog releases content if the main script fails. No browser storage is required for the intro.
- At widths up to 760px, program categories become three compact vertical selector cards with Tabler category icons. The active category reveals a two-column mini-grid of subjects below it. Horizontal scrolling and scroll snapping are explicitly removed. Below 340px only, the detail grid falls back to one column for legibility.
- Visible institutional terminology is standardized to `Ma'ahad` and `Asatidzah`. Technical selectors, the `maahad-faq` disclosure group, social handle, route anchors, and `maahad-*` asset paths remain unchanged.
- The hero image and gallery media move through native CSS scroll timelines. Fine-pointer movement shifts a separate hero-media wrapper, so it does not fight the image's scroll transform. Coarse pointers and reduced motion skip pointer parallax.
- Program information changes in place through accessible keyboard-operable tabs.
- The gallery uses an asymmetric editorial grid and native modal lightbox with previous/next controls, arrow-key navigation, Escape dismissal, and focus restoration.
- The profile-video area opens in a native accessible dialog. It has explicit unconfigured, loading, playback, and failed-load states and returns focus to its trigger on close.
- Activity cards open a native story dialog, with Escape/backdrop dismissal and return focus.
- Five FAQ answers use native details/summary elements; the shared name keeps one open at a time in supporting browsers.
- Scrollbar space is reserved to avoid shifts when the splash or a dialog locks scrolling.

## Runtime mapping

The runtime token source remains `assets/an-najah-v2.css`, with the light palette under `html[data-theme="light"]`. Shared interactions remain in `assets/an-najah-v2.js`. Initial theme and fail-open splash setup live in the HTML head. No external JavaScript or CSS framework is required. Moon/sun paths come from Tabler's official outline icons; their MIT license is in `assets/TABLER-LICENSE.txt`.

Hero-specific colors come from the root `--hero-*` tokens, mapped locally to hero text/buttons. The header consumes these through `--nav-*` tokens at the top and uses the page theme tokens after scrolling. The mobile dropdown keeps the page's surface/text colors in both states.

## Content and asset notes

- All active people imagery depicts an all-female Ma'ahad environment. Every visible santriwati and asatidzah, including background figures, wears a navy niqab/cadar. No male-student assets are referenced by the page.
- `assets/maahad-putri-hero-niqab.webp`, `maahad-putri-halaqah-niqab.webp`, `maahad-putri-lab-niqab.webp`, and `maahad-putri-campus-niqab.webp` are AI-generated concept photography, not documentary photos of the real campus. The gallery includes an explicit disclosure.
- Built-in image generation was used to edit four scenes: an outdoor Quran lesson, a library halaqah, a science lesson, and a campus walk. Shared edit prompt: give every female student and teacher a navy niqab covering the entire face except a narrow eye opening; preserve the composition, clothing, poses, lighting, architecture, and blue-gold palette; no men or boys.
- Original generated PNGs remain in `C:/Users/iqbal/.codex/generated_images/01a06270-e5aa-7ea2-b442-562a4cb22c7d/`. The final WebP files in this project are optimized derivatives.
- The inherited stock MP4 did not load reliably and was removed. No official video is present in the project. Set `data-video-src` on `#profileVideo` in `an-najah-4.html` to the official MP4 path or URL; the player loads only after a visitor opens it. Until configured, a designed availability message and program link are shown.
- Homepage copy prioritizes Al-Quran, Sunnah, akidah, adab, modest dress, and education specifically for santriwati. Niqab imagery is a visual requirement; the page does not claim an unverified formal admissions dress policy.
- Program names, achievements, contact details, admissions information, and every institutional claim must be verified by Ma'ahad An-Najah before production launch.
- The all-zero placeholder telephone number is no longer an active dial link. The map action is explicitly a search, not a claim to a verified street location.
- The user explicitly authorized dummy activities and social information. News titles, dates, and story text are examples, disclosed in the section and the story dialog. Social handles are samples; links currently open the respective platform homepages, never a guessed official account.
- Replace activity data in `#kegiatan` and the `storyCopy` object in the JavaScript. Replace social labels and hrefs in `#media-sosial`. The official video remains configured through `#profileVideo[data-video-src]`.

## Verification

- Requested responsive matrix: 360 x 800, 390 x 844, 430 x 932, 768 x 1024, 1024 x 768, and 1440 x 900 were visually reviewed in-browser. All six report zero positive horizontal overflow.
- Mobile programs at 360, 390, and 430px use full-width vertical category selectors with no horizontal scrolling or scroll snapping. Detail cards remain a two-column mini-grid with unclipped copy.
- Tablet and desktop at 768, 1024, and 1440px preserve the established program composition and hierarchy.
- Lightbox: next/previous buttons, keyboard arrows, Escape close, and return focus verified.
- Programs: tab selection and keyboard End navigation verified; all panels share an intrinsic-height grid to avoid page jumps.
- Video: unconfigured availability state and close/focus behavior verified. Official-media playback remains unverified until an official video is supplied.
- JavaScript syntax check passes. Strict frontend audit reports zero errors and zero warnings.
- Revision tests: run the single-process suite with `node tests/profile.test.mjs`; all 19 tests pass. The isolated `node --test` runner cannot spawn subprocesses in this sandbox, so the suite is executed directly with the same Node test API.
- The tests cover light default, persisted/invalid theme values, document-load splash, reduced-motion splash skipping, blocked storage, fail-open timeout, required sections, removal of admissions, local assets, anchors, dummy-content disclosures, approved terminology, preserved technical identifiers, the mobile program layout, and botanical splash coverage.
- Earlier browser revision checks covered keyboard FAQ, story open/Escape/focus restoration, general-subject panel, theme switching, and actual pointer-parallax style changes. No browser errors were reported in those checked states.
- Final viewport checks: 320 x 740 and 390 x 844 have no horizontal overflow and keep hero CTAs visible; 1920 x 1080 keeps the hero headline at two lines. Native scroll parallax was verified through changing rendered image transforms.
- Header refinement: desktop 1280 x 720 and mobile 390 x 844 retain their layout and readable blue photographic treatment. Both themes were checked at the top and while scrolled. The mobile dropdown retains dark labels on a light surface; Escape closes it and restores focus. The top state also remains transparent at 655 x 552, where the hero is taller than the viewport.
- Added tests verify the header sentinel, scrolling back to the top, and the no-IntersectionObserver fallback.
- Splash refinement: browser checks verify two clearly visible botanical frames, true stem drawing, sequential leaf opening, flower bloom, ambient sway, floating petals, inert main content during loading, a 740ms soft exit, and automatic reveal/unlock. Fake-clock tests cover the 2.7-second hold plus 740ms exit, failed decoding, stalled media, reduced motion at startup, and reduced motion enabled mid-intro.
- Final verification: direct single-process unit suite 19/19, JavaScript syntax check successful, strict static audit 0 errors/0 warnings, program click/ArrowDown keyboard interaction verified, and no browser warnings or errors reported. Lighthouse and OS-level reduced-transparency/high-contrast emulation were not run; no performance-score claim is made.
