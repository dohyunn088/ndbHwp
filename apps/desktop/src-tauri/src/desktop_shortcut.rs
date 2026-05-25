//! 바탕화면 바로가기 생성 모듈 (Windows 전용)
//!
//! 현재 실행 파일 경로를 읽어 사용자 바탕화면에 ndbHwp.lnk를 만듭니다.
//! Windows Shell API (IShellLink + IPersistFile) 대신 PowerShell WScript.Shell 을
//! 호출하는 방식으로 구현하여 COM/unsafe 의존을 최소화합니다.

use std::path::PathBuf;

/// 바탕화면에 ndbHwp 바로가기(.lnk)를 생성합니다.
///
/// 반환값: 생성된 바로가기 파일의 절대 경로 문자열
#[tauri::command]
pub fn create_desktop_shortcut() -> Result<String, String> {
    #[cfg(not(windows))]
    {
        return Err("바탕화면 바로가기 생성은 Windows에서만 지원됩니다.".to_string());
    }
    #[cfg(windows)]
    {
        create_shortcut_windows()
    }
}

#[cfg(windows)]
fn create_shortcut_windows() -> Result<String, String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("실행 파일 경로를 가져올 수 없습니다: {}", e))?;

    let desktop = desktop_dir()?;
    let link_path = desktop.join("ndbHwp.lnk");

    // PowerShell WScript.Shell 을 통해 .lnk 생성
    // 외부 COM 바인딩 없이 안전하게 처리
    let script = format!(
        r#"$ws = New-Object -ComObject WScript.Shell; \
$lnk = $ws.CreateShortcut('{link}'); \
$lnk.TargetPath = '{target}'; \
$lnk.WorkingDirectory = '{work}'; \
$lnk.Description = 'ndbHwp - HWP/HWPX 문서 편집기'; \
$lnk.Save()"#,
        link = link_path.to_string_lossy().replace('\'', "''"),
        target = exe_path.to_string_lossy().replace('\'', "''"),
        work = exe_path
            .parent()
            .unwrap_or(exe_path.as_path())
            .to_string_lossy()
            .replace('\'', "''"),
    );

    let status = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &script,
        ])
        .status()
        .map_err(|e| format!("PowerShell 실행 실패: {}", e))?;

    if !status.success() {
        return Err(format!(
            "바로가기 생성 스크립트가 실패했습니다 (종료 코드: {:?})",
            status.code()
        ));
    }

    Ok(link_path.to_string_lossy().to_string())
}

#[cfg(windows)]
fn desktop_dir() -> Result<PathBuf, String> {
    // USERPROFILE 또는 HOMEDRIVE+HOMEPATH 를 이용해 바탕화면 경로를 구합니다.
    // SHGetKnownFolderPath 대신 환경 변수를 사용해 unsafe 의존을 없앱니다.
    let user_profile = std::env::var("USERPROFILE")
        .map(PathBuf::from)
        .or_else(|_| {
            let drive = std::env::var("HOMEDRIVE").unwrap_or_default();
            let path = std::env::var("HOMEPATH").unwrap_or_default();
            Ok::<PathBuf, std::env::VarError>(PathBuf::from(format!("{}{}", drive, path)))
        })
        .map_err(|e: std::env::VarError| format!("홈 디렉터리를 찾을 수 없습니다: {}", e))?;

    let desktop = user_profile.join("Desktop");
    if desktop.is_dir() {
        return Ok(desktop);
    }

    // 한국어 Windows 등 로컬라이즈된 바탕화면 폴더명 대응
    let localized = user_profile.join("바탕 화면");
    if localized.is_dir() {
        return Ok(localized);
    }

    Err(format!(
        "바탕화면 폴더를 찾을 수 없습니다: {}",
        user_profile.display()
    ))
}
