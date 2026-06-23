# 저장소 가이드라인 (Repository Guidelines)

## 개요 (Overview)

ndbHwp는 macOS, Windows 및 Linux에서 HWP/HWPX 문서를 열고, 편집하고, 저장하고, 인쇄하고, 내보내기 위한 Tauri 2 데스크톱 애플리케이션입니다.

`pnpm`만 사용해야 합니다. npm 또는 yarn lockfile, 명령어, 워크플로 캐시 키를 추가하지 마세요.

핵심 스택:

- Tauri 2, Rust, TypeScript
- studio host를 위한 Vite 및 Vitest
- 읽기 전용 업스트림 서브모듈인 `third_party/rhwp`

## 프로젝트 구조 (Project Structure)

```text
apps/
  desktop/       Tauri 데스크톱 셸 및 네이티브 Rust 코드
  studio-host/   업스트림 rhwp-studio를 위한 ndbHwp 오버레이
third_party/
  rhwp/          읽기 전용 업스트림 서브모듈
assets/          icons, fonts, screenshots
docs/            개발, 아키텍처 및 릴리즈 노트
scripts/         유지 관리 스크립트
tests/           저장소 수준 테스트
```

## 필수 준수 사항 (Non-Negotiables)

- ndbHwp 제품 작업을 위해 `third_party/rhwp`는 읽기 전용 상태로 유지합니다. ndbHwp 고유의 동작은 `apps/desktop` 또는 `apps/studio-host`에 작성하세요.
- macOS, Windows 및 Linux 간의 크로스 플랫폼 동작을 유지합니다. 특정 OS에 종속된 경로, 셸 및 파일 시스템 가정을 피하세요.
- 비밀값(secrets), 서명 인증서, 공증 자격 증명, 토큰 또는 개인 문서의 내용을 로그에 기록하지 마세요.
- 사용자가 명시적으로 요청하지 않는 한 릴리즈 태그를 이동하거나 강제 푸시(force-push) 또는 히스토리를 재작성하지 마세요.
- 작업과 무관한 더티 작업 트리(dirty worktree)의 변경 사항은 그대로 둡니다.

## 계획 수립 (Planning)

작업이 사소하지 않거나 모호한 경우, 크로스 플랫폼, 릴리즈 관련 작업이거나 업스트림 통합에 영향을 주는 경우에는 코딩 전에 짧은 문제 기술서(Problem 1-Pager)를 작성하세요:

- 배경 (Background)
- 문제 (Problem)
- 목표 (Goal)
- 비목표 (Non-goals)
- 제약 조건 (Constraints)
- 구현 개요 (Implementation outline)
- 검증 계획 (Verification plan)
- 롤백 또는 복구 노트 (빌드/릴리즈 동작이 관련된 경우)

## AI 어시스턴트 지침 (AI Assistant Guidelines)

- **언어 및 주석**: 설명과 응답은 한국어로 하되, 코드 내 주석과 변수명/함수명은 영어로 작성하세요.
- **임의 추측 금지**: 명확하지 않은 기획이나 모호한 요구사항이 있을 경우, 임의로 가정하여 코드를 작성하지 말고 반드시 사용자에게 먼저 질문하여 의도를 확인하세요.
- **최소 침습적 수정**: 기존 코드를 수정할 때 파일을 전체적으로 덮어쓰지 말고, 변경이 필요한 부분만 정확히 찾아내어 수정(Patch)함으로써 예상치 못한 부작용을 최소화하세요.

작고 명확한 수정 작업의 경우, 관련 주변 코드를 읽은 후 바로 진행합니다.

## 코드 품질 (Code Quality)

- 편집하기 전에 주변 코드를 먼저 읽으세요.
- 숨겨진 마법 같은 코드보다는 명시적이고 의도가 잘 드러나는 코드를 지향합니다.
- 어댑터 계층은 얇게 유지하세요: TypeScript UI는 명확한 브릿지 API를 호출해야 하며, 네이티브 파일 시스템, 문서 세션, 저장/내보내기/인쇄 및 OS 통합 동작은 Rust가 소유해야 합니다.
- 부작용(side effects)은 경계 계층(boundary layers)에 둡니다.
- 임의의 문자열 조작 대신 경로, JSON, TOML, YAML 및 셸 인자 처리를 위한 구조화된 API를 사용하세요.
- 섣부른 추상화를 피하세요. 중복이 확실하거나 코드를 읽기 어려울 때만 헬퍼 함수를 추출합니다.
- 파일이나 함수가 너무 길어져서 동작을 가리기 전에 분할하세요.
- 플랫폼 간 차이를 염두에 두고 경로, 인코딩, 날짜/시간 및 프로세스 실행을 처리하세요.

권장 제한 사항:

- 파일 크기: 300 LOC (라인 수)
- 함수 크기: 50 LOC
- 매개변수 개수: 5개
- 순환 복잡도(Cyclomatic complexity): 10

변경 사항이 이 제한을 초과해야 하는 경우, 1-Pager에 그 이유를 문서화하거나 구현을 분할하세요.

## 업스트림 경계 (Upstream Boundary)

`third_party/rhwp`는 벤더 소스입니다. 다음 스크립트를 통해 업데이트합니다:

```bash
RUN_CHECKS=1 scripts/update-upstream.sh
```

업스트림 업데이트 후에는 서브모듈 포인터, `apps/studio-host` 별칭/오버라이드 호환성, Rust 네이티브 API 호환성, 그리고 ndbHwp 전용 파일, 인쇄, 창 및 드래그 앤 드롭 흐름을 점검하세요.

## 테스트 (Testing)

가장 구체적이고 관련된 검증부터 우선 실행하세요:

```bash
pnpm test
pnpm run test:upstream
pnpm run test:studio
pnpm run test:desktop
pnpm run clippy:desktop
pnpm run build:studio
pnpm --filter ndb-hwp-desktop tauri build --debug --bundles app
```

위험성이 높은 릴리즈, 패키징 또는 크로스 플랫폼 변경 사항의 경우, 배포하기 전에 필요한 macOS, Windows 및 Linux 검증 사항을 식별하세요.

## Codex 데스크톱 참고 사항 (Codex Desktop Note)

macOS에서 Codex 데스크톱 환경에서는 `rolldown`과 같은 네이티브 바인딩을 거부하는 자체 서명 Node 바이너리를 사용할 수 있어 `build:studio` 또는 `vitest`가 실패할 수 있습니다.

만약 `which node` 명령의 결과가 `/Applications/Codex.app/.../node`로 해석된다면, Vite 또는 Vitest를 실행하기 전에 외부 Node 런타임을 우선적으로 사용하도록 하세요. 예시:

```bash
export PATH="$HOME/.nvm/versions/node/v24.4.1/bin:$PATH"
pnpm run build:studio
pnpm --filter @golbin/hop-studio-host exec vitest run src/core/tauri-bridge.test.ts
```

외부 Node가 선택되었는지 확인하려면 `which node`를 실행하세요.

## GitHub Actions 및 릴리즈 (GitHub Actions And Release)

- 워크플로는 Node 24, Corepack, pnpm 및 `pnpm install --frozen-lockfile`을 사용해야 합니다.
- Tauri 액션 입력값은 설치된 `tauri-apps/tauri-action` 버전과 일치해야 합니다.
- pnpm 마이그레이션 이후에는 npm 네이티브 옵션 의존성 관련 임시 해결책(workarounds)을 다시 도입하지 마세요.
- 릴리즈 에셋 이름은 README 다운로드 링크 및 GitHub Releases와의 일치성을 위해 안정적으로 유지되어야 합니다.

## 커밋 및 PR (Commit And PR)

커밋은 작고 작업에 초점을 맞춰 유지하세요. 현재 작업과 관련된 파일만 스테이징하세요. 커밋 요약에는 동작 변경 사항, 릴리즈/빌드 영향, 업스트림 영향 및 수행된 검증 내용을 언급해야 합니다.
사용자가 명시적으로 요청하지 않는 한 커밋을 생성하거나 버전을 올리지 마세요.
