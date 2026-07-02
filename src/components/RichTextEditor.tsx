import { Bold, IndentDecrease, IndentIncrease, Italic, Pilcrow, Rows3 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { normalizeRichText, sanitizeRichText } from '../services/richText';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function RichTextEditor({ value, onChange, placeholder = '' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    const html = normalizeRichText(value);
    if (editor.innerHTML !== html) editor.innerHTML = html;
  }, [value]);

  function rememberSelection() {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection?.rangeCount || !editor || !editor.contains(selection.anchorNode)) return;
    savedRange.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const selection = window.getSelection();
    if (!selection || !savedRange.current) return;
    selection.removeAllRanges();
    selection.addRange(savedRange.current);
  }

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(sanitizeRichText(editor.innerHTML));
    rememberSelection();
  }

  function runCommand(command: string, commandValue?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function setLineHeight(value: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    const selection = window.getSelection();
    let element = selection?.anchorNode instanceof HTMLElement
      ? selection.anchorNode
      : selection?.anchorNode?.parentElement;
    while (element && element.parentElement !== editor && element !== editor) element = element.parentElement;
    if (element && element !== editor) element.style.lineHeight = value;
    emitChange();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    emitChange();
  }

  return (
    <div className="rich-editor-shell">
      <div className="rich-editor-toolbar" aria-label="เครื่องมือจัดรูปแบบต้นฉบับ">
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('bold')} title="ตัวหนา" aria-label="ตัวหนา"><Bold size={16} /></button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('italic')} title="ตัวเอียง" aria-label="ตัวเอียง"><Italic size={16} /></button>
        <span className="rich-editor-separator" />
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('formatBlock', 'p')} title="ย่อหน้าปกติ"><Pilcrow size={16} /><span>ย่อหน้า</span></button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('indent')} title="เพิ่มระยะย่อหน้า"><IndentIncrease size={16} /></button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('outdent')} title="ลดระยะย่อหน้า"><IndentDecrease size={16} /></button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('insertParagraph')} title="ขึ้นพารากราฟใหม่"><Rows3 size={16} /><span>เว้นบรรทัด</span></button>
        <label className="rich-line-height" onMouseDown={rememberSelection}>
          ระยะบรรทัด
          <select defaultValue="1.5" onChange={(event) => setLineHeight(event.target.value)}>
            <option value="1">1.0</option>
            <option value="1.5">1.5</option>
            <option value="2">2.0</option>
          </select>
        </label>
      </div>
      <div
        ref={editorRef}
        className="writer-manuscript rich-editor-content"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onFocus={rememberSelection}
        onPaste={handlePaste}
      />
    </div>
  );
}

export default RichTextEditor;
