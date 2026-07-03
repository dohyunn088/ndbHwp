# 저장소 가이드라인 (Repository Guidelines)

## 개요 (Overview)

ndbHwp는 macOS, Windows 및 Linux에서 HWP/HWPX 문서를 열고, 편집하고, 저장하고, 인쇄하고, 내보내기 위한 Tauri 2 데스크톱 애플리케이션입니다.

`pnpm`만 사용해야 합니다. npm 또는 yarn lockfile, 명령어, 워크플로 캐시 키를 추가하지 마세요.

핵심 스택:

- Tauri 2, Rust, TypeScript
- studio host를 위한 Vite 및 Vitest
- 자체 커스텀 개발을 진행 중인 코어 엔진 서브모듈 `third_party/rhwp`

## 프로젝트 구조 (Project Structure)

```text
apps/
  desktop/       Tauri 데스크톱 셸 및 네이티브 Rust 코드
  studio-host/   업스트림 rhwp-studio를 위한 ndbHwp 오버레이
third_party/
  rhwp/          자체 커스텀 개발 중인 코어 엔진 (수정 가능)
assets/          icons, fonts, screenshots
docs/            개발, 아키텍처 및 릴리즈 노트
scripts/         유지 관리 스크립트
tests/           저장소 수준 테스트
```

## 필수 준수 사항 (Non-Negotiables)

- ndbHwp 제품 작업을 위해 코어 엔진인 `third_party/rhwp`를 자체 커스텀 개발 방향으로 직접 수정합니다. 기능 추가나 버그 수정은 해당 디렉터리에서 직접 진행할 수 있습니다.
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
- 작고 명확한 수정 작업의 경우, 관련 주변 코드를 읽은 후 바로 진행합니다.

## 코드 품질 (Code Quality)

- **생각하고 더 생각하기**: 코드를 수정하기 전에 주변 코드를 먼저 읽고, 해당 변경이 전체 시스템(특히 크로스 플랫폼 및 업스트림 경계)에 미칠 영향도를 충분히 검토하세요. 섣부른 구현보다 구조적 동작을 명확히 이해하는 것이 우선입니다.
- **엉뚱한 소스 수정 금지**: 현재 해결하려는 작업 목표와 직접적인 연관이 없는 파일이나 코드를 임의로 수정하지 마세요. 버그 수정이나 기능 추가 시 변경 범위는 해당 기능으로 엄격히 제한되어야 합니다.
- **의도된 로깅 (Logging)**: 필요한 경우 흐름 파악과 디버깅을 위한 로그를 남기되, 필수 준수 사항(Non-Negotiables)에 위배되는 민감한 정보(비밀값, 개인 문서 내용 등)는 절대 포함되지 않도록 주의하세요.
- **셀프 리뷰 (Self-Review)**: PR(Pull Request)을 제출하기 전, 작성한 코드의 Diff를 직접 확인하며 셀프 리뷰를 진행하세요. 디버깅 목적으로 추가했던 임시 로그(`console.log`, `println!`)나 주석 처리된 코드가 남아있지 않은지 반드시 점검해야 합니다.
- **문서 및 주석 동기화 (Documentation & Comments Sync)**: 코드를 수정하거나 새로운 기능을 추가할 때는 관련 주석과 `docs/` 디렉토리의 문서도 반드시 함께 업데이트하세요. 코드는 거짓말을 하지 않지만, 방치된 주석은 치명적인 오해를 부릅니다.
- **명시적인 에러 처리 (Explicit Error Handling)**: Rust 백엔드에서 무분별한 `unwrap()`이나 `panic!` 사용을 지양하고, 명시적인 Result 타입을 반환하세요. TypeScript 프론트엔드에서는 브릿지 에러를 우아하게(gracefully) 포착하고 사용자에게 적절한 피드백을 제공해야 합니다.
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

## 업스트림 및 커스텀 개발 (Upstream & Custom Dev)

`third_party/rhwp`는 오픈소스를 포크하여 자체 커스텀 개발 중인 코어 엔진입니다. 필요한 API 추가 및 엔진 내부 버그 수정은 이곳에서 자유롭게 진행합니다. 다음 스크립트를 통해 업스트림 업데이트를 시도할 수 있으나, 자체 개발 내역과 충돌(Conflict)이 발생할 수 있으므로 주의해서 병합하세요:

```bash
RUN_CHECKS=1 scripts/update-upstream.sh
```

업스트림 병합 후에는 서브모듈 포인터, `apps/studio-host` 별칭/오버라이드 호환성, Rust 네이티브 API 호환성, 그리고 ndbHwp 전용 파일, 인쇄, 창 및 드래그 앤 드롭 흐름을 점검하세요.

## 테스트 (Testing)

- **원칙**: 소스코드를 수정한 후에는 반드시 관련된 단위 테스트(Unit Test)를 먼저 실행하여 기존 기능의 파괴(Regression) 여부를 확인해야 합니다.

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

- 커밋은 작고 작업에 초점을 맞춰 유지하세요. 현재 작업과 관련된 파일만 스테이징하세요. 커밋 요약에는 동작 변경 사항, 릴리즈/빌드 영향, 업스트림 영향 및 수행된 검증 내용을 언급해야 합니다.
- 사용자가 명시적으로 요청하지 않는 한 커밋을 생성하거나 버전을 올리지 마세요.
- **일관된 커밋 메시지 컨벤션 (Commit Message Convention)**: `feat:`(기능 추가), `fix:`(버그 수정), `docs:`(문서 수정), `refactor:`(리팩토링) 등의 명확한 접두사를 사용하여 커밋 메시지의 목적을 한눈에 파악할 수 있도록 작성하세요.
