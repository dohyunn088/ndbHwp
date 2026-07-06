# ndbHwp API 명세 요약

ndbHwp 데스크톱 앱(Tauri 기반) 및 프론트엔드 환경에서 사용되는 주요 API 계층과 명령어들을 정리한 문서입니다.

## 1. Tauri Commands (Rust <-> TypeScript 브릿지)
Tauri의 `#[tauri::command]`로 노출되어 프론트엔드에서 `invoke`를 통해 호출되는 백엔드 API 목록입니다. 주로 `apps/desktop/src-tauri/src/commands.rs`에 정의되어 있습니다.

### 1.1 문서 세션 및 파일 I/O
- `create_document`: 새 문서(빈 문서) 세션 생성
- `open_document_tracking`: 기존 HWP/HWPX 파일 열기
- `prepare_document_open`: 프론트엔드에서 파일 시스템 접근 권한 획득
- `take_pending_open_paths`: 외부 연결앱 설정 등으로 인한 대기 중인 열기 요청 경로 가져오기
- `close_document`: 문서 세션 종료
- `mark_document_dirty`: 문서를 수정(Dirty) 상태로 마킹
- `check_external_modification`: 외부 프로세스에 의해 문서가 변경되었는지 확인

### 1.2 저장 및 내보내기 (PDF)
- `prepare_staged_hwp_save`: 안전한 덮어쓰기를 위한 임시 HWP 저장 경로 준비
- `commit_staged_hwp_save`: 임시 파일로 저장된 내용을 최종 목적지 파일에 원자적으로 덮어쓰고 커밋
- `prepare_staged_hwp_pdf_export`: PDF 내보내기를 위한 임시 경로 준비
- `export_pdf`: 현재 열려 있는 문서를 PDF로 변환 및 내보내기
- `export_pdf_from_hwp_path`: 경로를 기반으로 문서를 PDF로 변환 및 내보내기

### 1.3 데이터 렌더링 및 쿼리
- `render_document_preview`: 문서 첫 페이지를 미리보기 위한 SVG 반환
- `render_page_svg`: 특정 문서 및 페이지의 내용을 SVG 포맷으로 반환
- `query_document`: 문서 코어 엔진에 상태나 데이터 질의 (JSON 기반)
- `mutate_document`: 문서 내용 및 구조에 대한 변경(Mutation) 요청

### 1.4 최근 문서 및 폰트
- `list_recent_documents`, `clear_recent_documents`, `record_recent_document`: 최근 열어본 문서 기록 관리
- `list_local_fonts`: 데스크톱에 설치된 로컬 폰트 목록(메타데이터) 조회
- `read_local_font`: 렌더링을 위해 특정 로컬 폰트 바이너리 읽기

### 1.5 시스템 및 창(Window) 제어
- `create_editor_window`: 새 편집기 윈도우 생성
- `destroy_current_window`, `cancel_app_quit`: 현재 창 닫기 및 앱 종료 흐름 제어
- `print_webview`: 현재 웹뷰 화면 인쇄 대화상자 호출
- `desktop_platform`: 현재 실행 중인 데스크톱 OS 식별 (windows, macos, linux)
- `reveal_in_folder`: 파일 탐색기/파인더에서 특정 경로를 하이라이트하며 열기

### 1.6 업데이트 및 기타 유틸리티
- `get_update_state`, `start_update_install`, `restart_to_apply_update`: 앱 자동 업데이트 관리 (다운로드, 진행 상태 추적, 재시작 등 / `updates.rs`)
- `create_desktop_shortcut`: Windows 바탕화면에 ndbHwp 바로가기(.lnk) 생성 (`desktop_shortcut.rs`)

---

## 2. 외부 프론트엔드 라이브러리 (Tauri API)
프론트엔드(`apps/studio-host/src/core/tauri-bridge.ts` 등)에서 활용되는 네이티브 접근용 모듈입니다.
- **`@tauri-apps/api/core`**: `invoke` 함수로 백엔드 커맨드 호출
- **`@tauri-apps/api/event`**: `listen` 함수로 백엔드의 작업 진행률(Progress), 업데이트 상태 등의 이벤트를 수신
- **`@tauri-apps/plugin-dialog`**: 네이티브 대화상자 호출 (`open`, `save`, `message`)
- **`@tauri-apps/plugin-fs`**: 기본적인 파일 메타데이터 읽기 및 삭제 등 (`openFs`, `stat`, `remove`)

---

## 3. 코어 엔진 (`third_party/rhwp`)
문서의 바이너리 포맷(HWP/HWPX)을 파싱하고 로직을 처리하는 Rust 기반 자체 코어 엔진입니다. Tauri 백엔드가 이를 감싸서 프론트엔드로 노출합니다.
- `DocumentCore`: 단일 문서의 세션, 캐시, 객체 상태를 관리하는 중심 구조체
- `editable_core_from_bytes`: HWP 바이트 배열을 파싱해 편집 및 렌더링 가능한 코어 인스턴스로 변환
- `render_page_svg_native`: 내부 엔진 로직을 통해 특정 페이지를 SVG 텍스트로 렌더링
- `export_core_to_pdf`: 코어 데이터를 기반으로 페이지를 순회하며 PDF 파일 스트림 생성
