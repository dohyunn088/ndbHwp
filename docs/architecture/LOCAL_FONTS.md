# 로컬 폰트 해석 규칙

ndbHwp는 `third_party/rhwp`를 수정하지 않고, 데스크톱 셸과 studio host override에서 로컬 폰트 해석을 소유한다.

## 목표

- 실제 OS 설치 폰트가 있으면 ndbHwp 번들 substitute보다 우선한다.
- 지원된 로컬 파일 기반 폰트는 repo나 릴리즈에 번들하지 않고도 editor/PDF export에서 같은 규칙으로 해석한다.
- proprietary 폰트 바이너리를 업로드, 로그 출력, 번들링하지 않는다.

## 해석 순서

1. system-installed 폰트
2. 지원된 file-backed 폰트
3. ndbHwp 번들 substitute 웹폰트

`apps/desktop/src-tauri/src/font_catalog.rs`가 native font catalog와 추가 스캔 루트를 소유한다. `apps/studio-host/src/core/local-fonts.ts`는 이 catalog를 읽어 webview에서 필요한 file-backed 폰트만 `FontFace`로 등록한다. `apps/studio-host/src/core/font-loader.ts`는 실제 사용 가능한 폰트 집합을 기준으로 substitute `@font-face`를 다시 계산한다.

## 지원 스캔 루트

기본 system font directory는 `fontdb.load_system_fonts()`에 맡긴다. 추가 스캔은 ndbHwp가 소유하는 bounded roots만 허용한다.

- macOS: `~/Library/Fonts`
- Linux: `~/.local/share/fonts`, `~/.fonts`, 필요 시 `/mnt/c/Windows/Fonts`
- Windows per-user: `%LOCALAPPDATA%/Microsoft/Windows/Fonts`

`%ProgramFiles%/Hnc/Office*/HOffice*/Shared/TTF` 같은 Windows Hancom vendor root는 의도적으로 스캔하지 않는다. proprietary Hancom/Human 폰트명을 참조하는 문서는 ndbHwp substitute 폰트로 렌더링하지만, 해당 로컬 vendor 폰트 바이너리를 authoring 폰트로 노출하지 않는다.

## 보안 및 라이선스 경계

- font file bytes는 현재 머신에서만 읽고, editor webview 등록에만 사용한다.
- file-backed font read는 지원된 스캔 루트 내부와 허용 확장자(`ttf`, `otf`, `ttc`, `otc`, `woff`, `woff2`)로 제한한다.
- proprietary font file path나 bytes를 telemetry, logs, release artifacts에 남기지 않는다.
- proprietary Hancom/Human family name은 authoring 폰트 목록에서 제외하고, 새 글자 서식 적용이나 HTML 붙여넣기 시 ndbHwp-safe substitute family로 정규화한다.
- ndbHwp repo에는 오픈 라이선스 substitute 폰트만 유지한다.

## Editor / PDF 일관성

- editor: `list_local_fonts` + `read_local_font` Tauri command를 통해 system-installed / file-backed 폰트를 구분하고 필요 시 lazy load한다.
- PDF export: `font_catalog::create_pdf_font_database()`를 사용해 같은 추가 스캔 루트를 공유한다.

이 규칙 덕분에 upstream `rhwp`를 건드리지 않고도 editor와 PDF export가 같은 high-level font discovery policy를 따른다.
