!macro NSIS_HOOK_POSTINSTALL
  ; Set custom icon for HWP and HWPX document associations
  WriteRegStr SHCTX "Software\\Classes\\HWP Document\\DefaultIcon" "" "$INSTDIR\\icons\\doc_hwp.ico"
  WriteRegStr SHCTX "Software\\Classes\\HWPX Document\\DefaultIcon" "" "$INSTDIR\\icons\\doc_hwp.ico"
  ; Remove user choice to ensure our icon is used
  DeleteRegKey SHCTX "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.hwp\\UserChoice"
  DeleteRegKey SHCTX "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.hwpx\\UserChoice"
  
  ; Notify Windows shell to invalidate icon cache and refresh
  System::Call "shell32::SHChangeNotify(i,i,i,i) (0x08000000, 0x1000, 0, 0)"
!macroend
