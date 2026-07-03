use rhwp::model::style::LineSpacingType;
use rhwp::DocumentCore;

/// 병원 서식 등에서 발생하는 HWP 렌더링 호환성 문제를 보정합니다.
///
/// 주로 타사 오피스나 구버전 한글에서 생성된 문서 중, 
/// 줄 간격이 0% 이하거나 음수인 경우 렌더링이 깨지는 문제를 해결합니다.
pub fn normalize_document(core: &mut DocumentCore) {
    let mut modified = false;
    let mut document = core.document().clone();

    // 1. 문단 모양 (ParaShape) 줄 간격 보정
    for para_shape in &mut document.doc_info.para_shapes {
        // 줄 간격이 0 이하거나, 10% 미만으로 비정상적으로 작은 경우 보정
        if para_shape.line_spacing <= 0 || (para_shape.line_spacing_type == LineSpacingType::Percent && para_shape.line_spacing < 10) {
            para_shape.line_spacing = 160;
            para_shape.line_spacing_type = LineSpacingType::Percent;
            para_shape.raw_data = None; // 직렬화 시 새로 계산되도록 원본 바이트 무효화
            modified = true;
        }
    }

    // 2. 추가적인 호환성 보정이 필요하면 여기에 구현합니다.
    // (예: 표 겹침 보정 등)
    // 현재는 줄 간격 보정이 가장 치명적인 렌더링 깨짐의 원인이므로 우선 적용합니다.

    // 변경사항이 있다면 캐시(스타일, 레이아웃 등)를 재구성합니다.
    if modified {
        document.doc_info.raw_stream_dirty = true;
        core.set_document(document);
    }
}
