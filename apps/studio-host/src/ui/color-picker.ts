/**
 * Hancom Office (한컴 오피스) 스타일의 고급 컬러 피커 드롭다운 컴포넌트
 */

const THEME_COLUMNS = [
  // 1열: 흰색 -> 회색 음영
  ['#ffffff', '#f2f2f2', '#e6e6e6', '#d9d9d9', '#cccccc', '#b3b3b3'],
  // 2열: 검은색 -> 회색/검정 음영
  ['#000000', '#7f7f7f', '#595959', '#3f3f3f', '#262626', '#0d0d0d'],
  // 3열: 연한 회색 계열
  ['#e6e6e6', '#f5f5f5', '#e8e8e8', '#d1d1d1', '#b5b5b5', '#999999'],
  // 4열: 남색/군청색 계열
  ['#3e4b5b', '#ebf0f5', '#d6e0eb', '#adc2d6', '#85a3c2', '#5c85ad'],
  // 5열: 파란색 계열
  ['#4a7ebe', '#eef3fa', '#dde6f4', '#bccdec', '#9bb4e4', '#799be0'],
  // 6열: 주황색 계열
  ['#d35f49', '#faeeec', '#f5ddda', '#ebbcba', '#e29b95', '#d87a71'],
  // 7열: 회적색/회색 계열
  ['#808b96', '#f2f4f5', '#e6e9ec', '#ccd3da', '#b3bec7', '#99a8b5'],
  // 8열: 금색/노란색 계열
  ['#f4b13a', '#fef7eb', '#fdf0d8', '#fbe1b1', '#fad289', '#f8c362'],
  // 9열: 하늘색 계열
  ['#69a4d2', '#f0f6fb', '#e1eef7', '#c2ddf0', '#a4ccee', '#85bbee'],
  // 10열: 녹색 계열
  ['#6d9f52', '#f0f5ee', '#e2ebdd', '#c4d7bc', '#a6c39a', '#89af79']
];

const STANDARD_COLORS = [
  '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050',
  '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'
];

export interface ColorPickerOptions {
  hasNone?: boolean; // "색 없음" 지원 여부
  noneLabel?: string;
  onSelect: (color: string) => void;
}

export class ColorPickerDropdown {
  private container: HTMLElement;
  private triggerButton: HTMLElement;
  private hiddenInput: HTMLInputElement;
  private dropdownEl: HTMLDivElement | null = null;
  private options: ColorPickerOptions;
  private documentClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor(triggerButton: HTMLElement, hiddenInput: HTMLInputElement, options: ColorPickerOptions) {
    this.triggerButton = triggerButton;
    this.hiddenInput = hiddenInput;
    this.options = options;

    // triggerButton의 부모 요소를 컨테이너로 삼음
    this.container = triggerButton.parentElement || triggerButton;
    this.container.style.position = 'relative';

    this.initEvents();
  }

  private initEvents(): void {
    // 트리거 버튼 클릭 시 드롭다운 토글
    this.triggerButton.addEventListener('mousedown', (e) => {
      // 인풋 피커 자체가 트리거되는 것을 방지
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });

    // 숨겨진 네이티브 컬러 인풋의 변경 이벤트 동기화
    const syncNativeChange = () => {
      const color = this.hiddenInput.value;
      this.options.onSelect(color);
    };
    this.hiddenInput.addEventListener('input', syncNativeChange);
    this.hiddenInput.addEventListener('change', syncNativeChange);
  }

  private toggleDropdown(): void {
    if (this.dropdownEl && this.dropdownEl.classList.contains('open')) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    // 이미 열려 있는 다른 드롭다운들을 닫음
    document.querySelectorAll('.hwp-color-dropdown.open').forEach((el) => {
      el.classList.remove('open');
    });

    if (!this.dropdownEl) {
      this.dropdownEl = this.createDropdownElement();
      this.container.appendChild(this.dropdownEl);
    }

    // 활성화된 색상 하이라이트 처리
    this.highlightCurrentColor();

    // 조금 딜레이를 주어 렌더링 후 클래스 부여
    requestAnimationFrame(() => {
      if (this.dropdownEl) {
        this.dropdownEl.classList.add('open');
      }
    });

    // 문서 클릭 리스너 등록 (바깥 클릭 시 닫기)
    this.documentClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (this.dropdownEl && !this.dropdownEl.contains(target) && !this.triggerButton.contains(target)) {
        this.close();
      }
    };
    // mousedown 대신 click으로 닫기 처리해 드롭다운 내 이벤트들이 마우스 오버 상태일 때 취소되지 않게 방지
    document.addEventListener('click', this.documentClickHandler);
  }

  public close(): void {
    if (this.dropdownEl) {
      this.dropdownEl.classList.remove('open');
    }
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
      this.documentClickHandler = null;
    }
  }

  private createDropdownElement(): HTMLDivElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'hwp-color-dropdown';

    // 1. 테마 색 섹션
    const themeTitle = document.createElement('div');
    themeTitle.className = 'hwp-color-section-title';
    themeTitle.textContent = '테마 색';
    dropdown.appendChild(themeTitle);

    const themeGrid = document.createElement('div');
    themeGrid.className = 'hwp-theme-grid';

    // 10열 6행 구조 생성
    for (let row = 0; row < 6; row++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'hwp-color-row';
      if (row === 0) rowEl.className += ' base-row';

      for (let col = 0; col < 10; col++) {
        const color = THEME_COLUMNS[col][row];
        const swatch = this.createSwatch(color);
        rowEl.appendChild(swatch);
      }
      themeGrid.appendChild(rowEl);
    }
    dropdown.appendChild(themeGrid);

    // 2. 표준 색 섹션
    const stdTitle = document.createElement('div');
    stdTitle.className = 'hwp-color-section-title';
    stdTitle.textContent = '표준 색';
    dropdown.appendChild(stdTitle);

    const stdRow = document.createElement('div');
    stdRow.className = 'hwp-color-row standard-row';
    for (const color of STANDARD_COLORS) {
      const swatch = this.createSwatch(color);
      stdRow.appendChild(swatch);
    }
    dropdown.appendChild(stdRow);

    // 3. 구분선 및 하단 액션
    const divider = document.createElement('div');
    divider.className = 'hwp-color-divider';
    dropdown.appendChild(divider);

    const actions = document.createElement('div');
    actions.className = 'hwp-color-actions';

    // 다른 색(M)... 버튼
    const btnOther = document.createElement('button');
    btnOther.className = 'hwp-color-action-btn other-btn';
    btnOther.innerHTML = '<span class="action-icon">🎨</span> 다른 색(M)...';
    btnOther.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
      this.hiddenInput.click();
    });
    actions.appendChild(btnOther);

    // 색 없음 지원 시 버튼 추가
    if (this.options.hasNone) {
      const btnNone = document.createElement('button');
      btnNone.className = 'hwp-color-action-btn none-btn';
      btnNone.innerHTML = `<span class="action-icon">⊘</span> ${this.options.noneLabel || '색 없음'}`;
      btnNone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
        this.options.onSelect('transparent');
      });
      actions.appendChild(btnNone);
    }

    dropdown.appendChild(actions);

    return dropdown;
  }

  private createSwatch(color: string): HTMLDivElement {
    const swatch = document.createElement('div');
    swatch.className = 'hwp-color-swatch';
    swatch.style.backgroundColor = color;
    swatch.title = color.toUpperCase();
    swatch.setAttribute('data-color', color.toLowerCase());

    swatch.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
      this.hiddenInput.value = color;
      this.options.onSelect(color);
    });

    return swatch;
  }

  private highlightCurrentColor(): void {
    if (!this.dropdownEl) return;

    // 기존의 모든 셀렉트 표시 제거
    this.dropdownEl.querySelectorAll('.hwp-color-swatch').forEach((sw) => {
      sw.classList.remove('selected');
    });

    const activeColor = this.hiddenInput.value.toLowerCase();
    const matchingSwatch = this.dropdownEl.querySelector(`.hwp-color-swatch[data-color="${activeColor}"]`);
    if (matchingSwatch) {
      matchingSwatch.classList.add('selected');
    }
  }
}
