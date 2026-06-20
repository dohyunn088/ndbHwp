import type { CursorRect } from '@/core/types';
import { VirtualScroll } from '@/view/virtual-scroll';
import { resolveVirtualScrollPageLeft } from '../view/page-left';

/** Canvas 위에 깜박이는 캐럿을 렌더링한다 */
export class CaretRenderer {
  private caretEl: HTMLDivElement;
  private blinkTimer: number | null = null;
  private visible = false;
  private currentRect: CursorRect | null = null;

  // IME 조합 오버레이
  private compEl: HTMLDivElement;
  private isCompMode = false;

  constructor(
    private container: HTMLElement,
    private virtualScroll: VirtualScroll,
  ) {
    this.caretEl = document.createElement('div');
    this.caretEl.className = 'caret';
    this.caretEl.style.cssText =
      'position:absolute;width:2px;background:#000;pointer-events:none;z-index:10;display:none;';

    // IME 조합 오버레이 (투명 배경 + 검은색 글자 + 밑줄)
    this.compEl = document.createElement('div');
    this.compEl.className = 'caret-composition';
    this.compEl.style.cssText =
      'position:absolute;background:transparent;color:transparent;pointer-events:none;z-index:10;display:none;' +
      'line-height:1;overflow:hidden;white-space:pre;text-align:left;box-sizing:border-box;border-bottom:1px solid #000;';

    // scroll-content 안에 배치 (스크롤과 함께 이동)
    const scrollContent = container.querySelector('#scroll-content');
    if (scrollContent) {
      scrollContent.appendChild(this.caretEl);
      scrollContent.appendChild(this.compEl);
    } else {
      container.appendChild(this.caretEl);
      container.appendChild(this.compEl);
    }
  }

  /** 캐럿을 표시한다 */
  show(rect: CursorRect, zoom: number): void {
    this.ensureAttached();
    this.currentRect = rect;
    this.updatePosition(zoom);
    this.caretEl.style.display = 'block';
    this.startBlink();
  }

  /** 캐럿을 숨긴다 */
  hide(): void {
    this.stopBlink();
    this.caretEl.style.display = 'none';
    this.compEl.style.display = 'none';
    this.isCompMode = false;
    this.currentRect = null;
  }

  /**
   * IME 조합 텍스트를 캐럿 영역에 오버레이한다
   * (Canvas에 아직 렌더링되지 않은 중간 조합 텍스트 표시용)
   */
  updateComposition(
    rect: CursorRect,
    zoom: number,
    text: string,
    fontFamily: string,
    width: number,
  ): void {
    this.ensureAttached();
    this.isCompMode = true;
    this.currentRect = rect;
    this.updatePosition(zoom);

    // 실제 화면처럼 보이도록 배경 투명, 글자색은 투명하게 (Wasm이 그리도록) 지정
    this.compEl.style.background = 'transparent';
    this.compEl.style.color = 'transparent';

    this.compEl.style.fontFamily = fontFamily;
    this.compEl.style.width = `${width * zoom}px`;
    this.compEl.textContent = text;
    this.compEl.style.display = 'block';
    this.compEl.style.opacity = '1';
    this.visible = true;
    this.startBlink();
  }

  /** 줌/스크롤 변경 시 위치를 갱신한다 */
  updatePosition(zoom: number): void {
    if (!this.currentRect) return;
    const { pageIndex, x, y, height } = this.currentRect;
    const pageOffset = this.virtualScroll.getPageOffset(pageIndex);
    const pageLeft = this.calcPageLeft(pageIndex);

    this.caretEl.style.left = `${pageLeft + x * zoom}px`;
    this.caretEl.style.top = `${pageOffset + y * zoom}px`;
    this.caretEl.style.height = `${height * zoom}px`;
    
    if (this.isCompMode) {
      this.compEl.style.left = `${pageLeft + x * zoom}px`;
      this.compEl.style.top = `${pageOffset + y * zoom}px`;
      this.compEl.style.height = `${height * zoom}px`;
      this.compEl.style.fontSize = `${height * 0.85 * zoom}px`;
      this.compEl.style.lineHeight = `${height * zoom}px`;
    }
  }

  /** 새 CursorRect로 갱신한다 (깜박임 리셋) */
  update(rect: CursorRect, zoom: number): void {
    this.ensureAttached();
    this.currentRect = rect;
    this.updatePosition(zoom);
    this.caretEl.style.display = 'block';
    this.caretEl.style.opacity = '1';
    this.visible = true;
    this.startBlink();
  }

  /** 드래그 중 캐럿 위치를 갱신한다. 기존 깜박임 타이머는 유지한다. */
  updateLive(rect: CursorRect, zoom: number): void {
    this.ensureAttached();
    this.currentRect = rect;
    this.updatePosition(zoom);
    this.caretEl.style.display = 'block';
    this.caretEl.style.opacity = '1';
    this.visible = true;
    if (this.blinkTimer === null) {
      this.startBlink();
    }
  }

  /** IME 조합 오버레이를 표시한다 */
  showComposition(startRect: CursorRect, charWidth: number, zoom: number, text: string, fontFamily: string): void {
    this.ensureAttached();
    this.isCompMode = true;

    const { pageIndex, x, y, height } = startRect;
    const pageOffset = this.virtualScroll.getPageOffset(pageIndex);
    const pageLeft = this.calcPageLeft(pageIndex);

    // 블랙박스 위치/크기
    const w = Math.max(charWidth, height * 0.6) * zoom;
    const h = height * zoom;
    const left = pageLeft + x * zoom;
    const top = pageOffset + y * zoom;

    this.compEl.style.left = `${left}px`;
    this.compEl.style.top = `${top}px`;
    this.compEl.style.width = `${w}px`;
    this.compEl.style.height = `${h}px`;
    this.compEl.style.fontSize = `${height * 0.85 * zoom}px`;
    this.compEl.style.fontFamily = fontFamily || 'sans-serif';
    this.compEl.style.lineHeight = `${h}px`;
    this.compEl.textContent = text;
    this.compEl.style.display = 'block';
    this.compEl.style.opacity = '1';
    this.visible = true;
    this.startBlink();
  }

  /** IME 조합 오버레이를 숨기고 일반 캐럿으로 복귀한다 */
  hideComposition(): void {
    if (!this.isCompMode) return;
    this.isCompMode = false;
    this.compEl.style.display = 'none';
  }

  /** 페이지의 화면 X 좌표를 계산한다 (그리드/단일 열 공통) */
  private calcPageLeft(pageIndex: number): number {
    const scrollContent = this.container.querySelector('#scroll-content');
    const contentWidth = scrollContent?.clientWidth ?? 0;
    return resolveVirtualScrollPageLeft(this.virtualScroll, pageIndex, contentWidth);
  }

  /** 캐럿 엘리먼트가 DOM에 없으면 재부착한다 (loadDocument 후 innerHTML 초기화 대응) */
  private ensureAttached(): void {
    const scrollContent = this.container.querySelector('#scroll-content');
    if (this.caretEl.parentElement && this.compEl.parentElement) return;
    if (scrollContent) {
      if (!this.caretEl.parentElement) scrollContent.appendChild(this.caretEl);
      if (!this.compEl.parentElement) scrollContent.appendChild(this.compEl);
    }
  }

  private startBlink(): void {
    this.stopBlink();
    this.visible = true;
    this.caretEl.style.opacity = '1';
    this.compEl.style.opacity = '1'; // 조합박스는 항상 보이게 유지
    this.blinkTimer = window.setInterval(() => {
      this.visible = !this.visible;
      // 일반 세로선 캐럿만 깜빡임
      this.caretEl.style.opacity = this.visible ? '1' : '0';
      this.compEl.style.opacity = '1';
    }, 500);
  }

  private stopBlink(): void {
    if (this.blinkTimer !== null) {
      clearInterval(this.blinkTimer);
      this.blinkTimer = null;
    }
  }

  dispose(): void {
    this.stopBlink();
    this.caretEl.remove();
    this.compEl.remove();
  }
}
