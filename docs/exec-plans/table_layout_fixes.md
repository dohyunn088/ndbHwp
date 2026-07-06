# 문제 해결 1-Pager: 표(Table) 렌더링 레이아웃 겹침 및 셀 마진 오버플로우

## Background
외부에서 생성된 한글 문서(HWP/HWPX)를 자체 코어 엔진(`rhwp`)으로 렌더링할 때, 특히 표(Table) 객체와 관련된 심각한 레이아웃 버그 2건이 보고되었습니다.

## Problem
1. **TreatAsChar (글자처럼 취급) 표 위치 겹침**: 표 아래에 와야 할 텍스트가 표 밑으로 밀리지 않고 표 뒤나 사이로 겹쳐서 렌더링됩니다.
2. **셀 내부 여백(Margin) 무시 및 텍스트 오버플로우**: 셀 내부의 텍스트가 셀의 가로 폭 제약을 벗어나 경계선을 뚫고 넘치거나(Overflow) 글자가 겹칩니다.

## Goal
- `TreatAsChar` 옵션이 켜져 있는 표 객체가 렌더링될 때 블록 레이아웃 컨텍스트의 Y 좌표(vpos/current_height)가 실제 표의 높이만큼 누적되도록 수정.
- 셀 내부 텍스트 렌더링 시, `셀 전체 너비 - (좌여백 + 우여백)`을 가용 너비(Available Width)로 설정하여 올바르게 텍스트 래핑(자동 줄바꿈)이 되도록 수정.

## Non-goals
- 표의 병합 셀(Merge)이나 테두리(Border) 렌더링 로직 등 이번 레이아웃 버그와 무관한 기능은 수정하지 않음.

## Implementation outline
1. **TreatAsChar 높이 계산 수정**:
   - `src/renderer/pagination/engine.rs` 및 `src/renderer/composer.rs` (또는 `height_measurer.rs`)에서 `TreatAsChar` 표의 높이가 문단의 가용 Y축 위치(vpos)를 밀어내는지 점검하고 수정합니다.
2. **셀 마진 계산 수정**:
   - `src/renderer/height_measurer.rs`에서 `cell.apply_inner_margin`을 통해 `pad_left`, `pad_right`를 계산하는 부분과 텍스트 레이아웃 과정에서 이 패딩이 가용 너비(`eff_width`)를 올바르게 줄여주도록 보장합니다.

## Verification plan
- 관련된 단위 테스트 패스 확인 (`cargo test`)
- 데스크톱 스튜디오 호스트 환경에서 문제가 발생했던 샘플 문서를 시각적으로 렌더링하여 겹침(Overlap)과 오버플로우(Overflow) 현상이 해결되었는지 확인.
