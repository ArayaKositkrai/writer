import { ArrowRight, Check, ChevronDown, Settings, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { NovelProject, WorkflowStep } from '../types';

interface IdeaBaseProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

// Preset ของแนวเรื่อง สำหรับโชว์ใน Dropdown
const presetGenres = [
  'รักโรแมนติก', 'รู้จักกันตอนเด็ก', 'กลับมาเจออีกครั้ง', 'แฟนตาซี', 
  'ลึกลับ / สืบสวน', 'ย้อนเวลา (Isekai)', 'กำลังภายใน', 'หักมุมสุดติ่ง', 'ดราม่าบีบคั้น'
];

const chapterOptions = ['30 ตอน (ขนาดกลาง)', '50 ตอน (มาตรฐาน - แนะนำ)', '100 ตอน (เรื่องยาว)', '200+ ตอน (มหากาพย์)'];
const wordOptions = ['800 - 1,200 คำ', '1,500 - 2,000 คำ (แนะนำ)', '2,000 - 3,000 คำ', '3,000 คำขึ้นไป'];
const twistOptions = ['ไม่มี Plot Twist', 'มี Plot Twist ทุกๆ 10 ตอน (แนะนำ)', 'หักมุมซ้อนหักมุม (Mind-bending)'];
const aiSkillOptions = ['นักเขียนมือใหม่ (ภาษาเข้าใจง่าย)', 'นักเขียนระดับ Bestseller (พล็อตซับซ้อน ดราม่า)', 'เน้นการบรรยายสละสลวย (Poetic)'];

const genderOptions = [
  'ตัวเอกหญิง (Heroine - เน้นการต่อสู้ ดิ้นรน หรือความฉลาด)',
  'ตัวเอกชาย (Hero)',
  'ตัวเอกหลายคน (Multiple POVs - เล่าผ่านหลายมุมมอง)',
  'ไม่ระบุเพศ / หลากหลาย (Non-binary / LGBTQ+)',
  'เปลี่ยนเพศ (Gender Bender)',
  'ตัวเอกไร้เพศ (เช่น สไลม์, AI, สิ่งประดิษฐ์)'
];

const namingOptions = [
  'ไทย (เช่น ตะวัน, นครา, ภูผา, ฟ้าใส)',
  'จีน (เช่น หรงเฟย, เสี่ยวชิง, เลี่ยงหลิน, หวังเหว่ย)',
  'ญี่ปุ่น (เช่น คิริโตะ, ซากุระ, เรียว, ฮิคาริ)',
  'เกาหลี (เช่น จินอู, ซออา, โดฮยอน, จีอึน)',
  'อังกฤษ / ตะวันตก (เช่น อาเธอร์, อลิซ, โอลิเวอร์)',
  'แฟนตาซีประยุกต์ / ยุโรปยุคกลาง (เช่น เอลริค, ลูเมียน, เซราฟิน่า)'
];

// เพิ่มตัวเลือกพล็อตยอดนิยม
const templateOptions = [
  'แก้แค้น / เกิดใหม่ (Revenge / Rebirth)',
  'ระบบตัวช่วย (System)',
  'เอาชีวิตรอด (Survival / Apocalypse)',
  'โลกเสมือน / เกมออนไลน์ (VRMMO)',
  'สร้างเมือง / บริหารดินแดน (Kingdom Building)',
  'ทำฟาร์ม / สโลว์ไลฟ์ (Farming / Slice of Life)',
  'สืบสวนปมปริศนา (Mystery / Detective)',
  'รักในรั้วโรงเรียน / มหาวิทยาลัย (School Life / Romance)',
  'ทะลุมิติไปเป็นตัวร้าย (Villainess / Isekai)',
  'แอบรัก / คลั่งรัก (Unrequited Love / Obsessive)',
  'การต่อสู้ดิ้นรนเพื่อจุดสูงสุด (Zero to Hero)'
];

const expectedOutputsList = [
  { id: '1', label: '1. ชื่อเรื่องภาษาไทย/อังกฤษ' },
  { id: '2', label: '2. คำโปรยนิยายดึงดูดผู้อ่าน' },
  { id: '3', label: '3. แฟ้มประวัติและพัฒนาการตัวละคร' },
  { id: '4', label: '4. รายละเอียดโลก (World Building)' },
  { id: '5', label: '5. ไทม์ไลน์เหตุการณ์สำคัญ' },
  { id: '6', label: '6. โครงเรื่องย่อยครบทุกตอน (3-5 บรรทัด)' },
  { id: '7', label: '7. จุดหักมุมและเฉลยความจริง' },
  { id: '8', label: '8. ตอนจบที่ค้างคา/ประทับใจ' },
];

// Component เล็กๆ สำหรับแสดง Tooltip
function HelpTooltip({ text }: { text: string }) {
  return (
    <span className="help-dot" data-tooltip={text}>?</span>
  );
}

function IdeaBase({ project, updateProject, goToStep }: IdeaBaseProps) {
  const idea = project.idea as any; 
  const [customKeyword, setCustomKeyword] = useState('');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  
  const genreRef = useRef<HTMLDivElement>(null);

  const selectedGenres: string[] = idea.genres || [];
  const expectedOutputs: string[] = idea.expectedOutputs || ['1', '2', '3', '4', '6', '8']; 
  const currentChapterOption = idea.chapterCountStr
    || chapterOptions.find((option) => Number.parseInt(option, 10) === idea.chapterCount)
    || `${idea.chapterCount || 1} ตอน (ค่าปัจจุบัน)`;

  // ปิด Dropdown เมื่อคลิกที่อื่น
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genreRef.current && !genreRef.current.contains(event.target as Node)) {
        setIsGenreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleGenre(genre: string) {
    updateProject((current: any) => {
      const hasGenre = current.idea.genres.includes(genre);
      return {
        ...current,
        idea: {
          ...current.idea,
          genres: hasGenre ? current.idea.genres.filter((item: string) => item !== genre) : [...current.idea.genres, genre],
        },
      };
    });
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const kw = customKeyword.trim();
      if (kw && !selectedGenres.includes(kw)) {
        updateProject((current: any) => ({
          ...current,
          idea: { ...current.idea, genres: [...current.idea.genres, kw] }
        }));
        setCustomKeyword('');
      }
    }
    if (e.key === 'Backspace' && customKeyword === '' && selectedGenres.length > 0) {
      toggleGenre(selectedGenres[selectedGenres.length - 1]);
    }
  }

  function toggleExpectedOutput(id: string) {
    updateProject((current: any) => {
      const currentOutputs = current.idea.expectedOutputs || [];
      const hasOutput = currentOutputs.includes(id);
      return {
        ...current,
        idea: {
          ...current.idea,
          expectedOutputs: hasOutput ? currentOutputs.filter((item: string) => item !== id) : [...currentOutputs, id],
        },
      };
    });
  }

  const updateIdeaField = (field: string, value: any) => {
    updateProject((current: any) => ({
      ...current,
      idea: { ...current.idea, [field]: value },
    }));
  };

  function updateChapterCount(value: string) {
    const count = Number.parseInt(value.replace(/[^0-9].*$/, ''), 10) || 30;
    updateProject((current: any) => ({
      ...current,
      idea: { ...current.idea, chapterCountStr: value, chapterCount: count },
    }));
  }

  function handleGeneratePitches() {
    goToStep('pitch');
  }

  return (
    <div className="modern-form-wrapper">
      <div className="modern-form-card">
        
        {/* Header - Full Width */}
        <div className="form-header">
          <div className="header-title-group">
            <span className="step-badge">Step 1</span>
            <Settings className="header-icon" size={24} />
            <h2>ตั้งค่าข้อมูลนิยายของคุณ</h2>
          </div>
          <button className="submit-btn" onClick={handleGeneratePitches}>
            ถัดไป: เสนอโครงเรื่อง <ArrowRight size={16} />
          </button>
        </div>

        {/* Body - Scrollable Full Screen */}
        <div className="form-body">
          
          <div className="form-row">
            <div className="form-group full-width">
              <label>
                ชื่อเรื่อง (Title) 
                <HelpTooltip text="ชื่อเรื่องหลัก หรือชื่อชั่วคราวที่คุณใช้เรียกโปรเจกต์นี้" />
              </label>
              <input
                type="text"
                className="modern-input"
                placeholder="ระบุชื่อเรื่องที่ต้องการ..."
                value={project.title}
                onChange={(e) => updateProject((current) => ({ ...current, title: e.target.value }))}
              />
            </div>
          </div>

          {/* Combined Input Bar สำหรับ แนวเรื่อง/คีย์เวิร์ด */}
          <div className="form-row" ref={genreRef}>
            <div className="form-group full-width">
              <label>
                แนวเรื่อง / คีย์เวิร์ดสำคัญ 
                <HelpTooltip text="พิมพ์คีย์เวิร์ดแล้วกด Enter หรือคลิกไอคอนลูกศรเพื่อเลือกจากตัวเลือกสำเร็จรูป" />
              </label>
              
              <div className={`combo-input-box ${isGenreDropdownOpen ? 'focused' : ''}`}>
                <div className="combo-tags-area">
                  {selectedGenres.map(tag => (
                    <span key={tag} className="combo-tag">
                      {tag}
                      <button type="button" onClick={() => toggleGenre(tag)}><X size={12} /></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="combo-text-input"
                    placeholder={selectedGenres.length === 0 ? "พิมพ์คีย์เวิร์ดแล้วกด Enter..." : ""}
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    onClick={() => setIsGenreDropdownOpen(true)}
                  />
                </div>
                <button 
                  type="button"
                  className="combo-dropdown-btn" 
                  onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                >
                  <ChevronDown size={18} />
                </button>

                {/* Dropdown Menu */}
                {isGenreDropdownOpen && (
                  <div className="combo-dropdown-menu">
                    <div className="dropdown-title">หรือเลือกจากสูตรสำเร็จ:</div>
                    {presetGenres.map(genre => (
                      <button 
                        key={genre}
                        type="button"
                        className={`dropdown-item ${selectedGenres.includes(genre) ? 'selected' : ''}`}
                        onClick={() => { toggleGenre(genre); setIsGenreDropdownOpen(false); }}
                      >
                        <span className="check-area">{selectedGenres.includes(genre) && <Check size={14} />}</span>
                        {genre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>
                ไอเดียตั้งต้น / พล็อตที่มีอยู่ 
                <HelpTooltip text="ยิ่งคุณอธิบายตัวเอกหรือปมปัญหาชัดเจน AI จะยิ่งสร้างโครงเรื่องได้ตรงใจมากขึ้น" />
              </label>
              <textarea
                className="modern-input"
                rows={3}
                placeholder="ตัวเอกเป็นใคร? ต้องการอะไร? เจออุปสรรคอะไร? และอะไรคือจุดขายของเรื่องนี้..."
                value={idea.seedIdea || ''}
                onChange={(e) => updateIdeaField('seedIdea', e.target.value)}
              />
            </div>
          </div>

          {/* Grid Dropdowns */}
          <div className="form-grid-2col">
            <div className="form-group">
              <label>
                จำนวนตอนเป้าหมาย 
                <HelpTooltip text="จำนวนตอนส่งผลต่อจังหวะความช้า-เร็ว (Pacing) ของเรื่องราว" />
              </label>
              <select className="modern-select" value={currentChapterOption} onChange={(e) => updateChapterCount(e.target.value)}>
                {!chapterOptions.includes(currentChapterOption) && <option value={currentChapterOption}>{currentChapterOption}</option>}
                {chapterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>
                ความยาวคำเฉลี่ยต่อตอน 
                <HelpTooltip text="ใช้สำหรับให้ AI กะปริมาณเนื้อหาในแต่ละตอนให้เหมาะสม" />
              </label>
              <select className="modern-select" value={idea.wordsPerChapter || wordOptions[1]} onChange={(e) => updateIdeaField('wordsPerChapter', e.target.value)}>
                {wordOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>
                ความถี่ของจุดหักมุม (Plot Twist) 
                <HelpTooltip text="เลือกระดับความถี่ของการใส่เหตุการณ์ไม่คาดฝันลงในพล็อต" />
              </label>
              <select className="modern-select" value={idea.twistFrequency || twistOptions[1]} onChange={(e) => updateIdeaField('twistFrequency', e.target.value)}>
                {twistOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>
                ทักษะ/ระดับผู้แต่งนิยายของ AI 
                <HelpTooltip text="โหมด Bestseller AI จะพยายามผูกปมให้ลึกขึ้น โหมด Poetic AI จะเน้นคำสละสลวย" />
              </label>
              <select className="modern-select" value={idea.aiSkillLevel || aiSkillOptions[1]} onChange={(e) => updateIdeaField('aiSkillLevel', e.target.value)}>
                {aiSkillOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>
                เพศของตัวเอกหลัก (Protagonist Gender)
                <HelpTooltip text="กำหนดเพศของตัวเอก เพื่อให้ AI ใช้สรรพนามและสร้างพฤติกรรมให้สอดคล้อง" />
              </label>
              <select className="modern-select" value={idea.protagonistGender || genderOptions[0]} onChange={(e) => updateIdeaField('protagonistGender', e.target.value)}>
                {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>
                สไตล์การตั้งชื่อตัวละคร (Character Naming Style) 
                <HelpTooltip text="AI จะตั้งชื่อตัวละครทั้งหมดให้ตรงกับสไตล์ที่คุณเลือก" />
              </label>
              <select className="modern-select" value={idea.namingStyle || namingOptions[0]} onChange={(e) => updateIdeaField('namingStyle', e.target.value)}>
                {namingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>
                พล็อตยอดนิยม / ธีมหลัก (Popular Plot Template)
                <HelpTooltip text="เลือกพล็อตยอดนิยมจากรายการเพื่อใช้เป็นโครงฐานของเรื่อง" />
              </label>
              <select className="modern-select" value={idea.template || ''} onChange={(event) => updateIdeaField('template', event.target.value)}>
                <option value="" disabled>เลือกพล็อตยอดนิยม</option>
                {templateOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '8px' }}>
            <div className="form-group full-width">
              <label>
                ข้อกำหนดพิเศษ / เงื่อนไขเฉพาะตัว 
                <HelpTooltip text="AI จะบังคับทำตามเงื่อนไขนี้อย่างเคร่งครัด (เช่น ห้ามจบ Bad End, บังคับตัวเอกมีพลังระบบ)" />
              </label>
              <textarea
                className="modern-input"
                rows={3}
                placeholder="ระบุข้อห้ามหรือสิ่งที่ต้องมีอย่างชัดเจน..."
                value={idea.authorNotes || ''}
                onChange={(e) => updateIdeaField('authorNotes', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '8px', paddingBottom: '24px' }}>
            <div className="form-group full-width">
              <label>
                ผลลัพธ์ที่ต้องการให้สร้าง 
                <HelpTooltip text="เลือกข้อมูลที่คุณอยากให้ AI ประมวลผลและส่งกลับมาให้พิจารณาในหน้าถัดไป" />
              </label>
              <div className="checkbox-grid">
                {expectedOutputsList.map((opt) => (
                  <label key={opt.id} className="custom-checkbox-label">
                    <input
                      type="checkbox"
                      checked={expectedOutputs.includes(opt.id)}
                      onChange={() => toggleExpectedOutput(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .modern-form-wrapper {
          height: 100%;
          width: 100%;
          padding: 4px; 
          background-color: transparent;
          display: flex;
          flex-direction: column;
        }

        .modern-form-card {
          width: 100%;
          height: 100%; /* เต็มความสูง */
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #f3f4f6;
          background: #ffffff;
        }
        .header-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .step-badge {
          background: #e0e7ff;
          color: #4338ca;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-icon { color: #7c3aed; }
        .form-header h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #1f2937; }

        .submit-btn {
          display: flex; align-items: center; gap: 8px;
          background: #7c3aed; color: #ffffff; border: none;
          padding: 10px 20px; border-radius: 8px;
          font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .submit-btn:hover { background: #6d28d9; }

        /* Body Scrollable */
        .form-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row { width: 100%; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .full-width { width: 100%; }
        
        .form-group label {
          display: flex; align-items: center;
          font-size: 0.85rem; font-weight: 600; color: #4b5563;
        }

        /* Tooltip CSS บริสุทธิ์ (ลอยบนสุด Z-index 99999) */
        .help-dot {
          display: inline-flex; justify-content: center; align-items: center;
          width: 16px; height: 16px; border-radius: 50%;
          background: #e0e7ff; color: #4338ca; font-size: 10px; font-weight: 800;
          margin-left: 8px; cursor: help; position: relative;
        }
        .help-dot::before {
          content: attr(data-tooltip);
          position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%);
          width: max-content; max-width: 260px;
          background: #1f2937; color: #ffffff;
          padding: 8px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 400;
          line-height: 1.4; white-space: normal; text-align: left;
          opacity: 0; pointer-events: none; transition: opacity 0.2s; z-index: 99999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        /* ลูกศรชี้ลง */
        .help-dot::after {
          content: "";
          position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
          border-width: 5px; border-style: solid;
          border-color: #1f2937 transparent transparent transparent;
          opacity: 0; pointer-events: none; transition: opacity 0.2s; z-index: 99999;
        }
        .help-dot:hover::before, .help-dot:hover::after { opacity: 1; }

        /* Input & Select */
        .modern-input, .modern-select {
          width: 100%; padding: 10px 14px;
          background-color: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 8px; font-size: 0.9rem; color: #374151;
          transition: all 0.2s; outline: none; font-family: inherit;
        }
        .modern-input:focus, .modern-select:focus {
          border-color: #7c3aed; background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        textarea.modern-input { resize: vertical; line-height: 1.6; }

        /* Combo Input Box (Multi-select + Tag Input & Template Input) */
        .combo-input-box {
          position: relative;
          display: flex; align-items: flex-start;
          width: 100%; min-height: 44px;
          background-color: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 8px; transition: all 0.2s;
        }
        .combo-input-box.focused {
          border-color: #7c3aed; background-color: #ffffff; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .combo-tags-area {
          flex: 1; display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 10px;
        }
        .combo-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f5f3ff; color: #7c3aed;
          padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;
          border: 1px solid #e0e7ff;
        }
        .combo-tag button {
          background: transparent; border: none; padding: 0; color: inherit;
          display: grid; place-items: center; cursor: pointer; opacity: 0.6;
        }
        .combo-tag button:hover { opacity: 1; }
        .combo-text-input {
          flex: 1; min-width: 180px; border: none; background: transparent;
          outline: none; font-size: 0.9rem; padding: 4px 0; color: #374151;
        }
        .combo-dropdown-btn {
          width: 40px; height: 44px; display: grid; place-items: center;
          background: transparent; border: none; border-left: 1px solid #e5e7eb;
          color: #6b7280; cursor: pointer; flex-shrink: 0;
        }
        .combo-dropdown-menu {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100;
          max-height: 240px; overflow-y: auto; padding: 8px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .dropdown-title { padding: 4px 8px 8px; font-size: 0.75rem; color: #6b7280; font-weight: 600; }
        .dropdown-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px; width: 100%; border: none; background: transparent;
          text-align: left; font-size: 0.85rem; color: #374151; border-radius: 6px; cursor: pointer;
        }
        .dropdown-item:hover { background: #f3f4f6; }
        .dropdown-item.selected { background: #f5f3ff; color: #7c3aed; font-weight: 600; }
        .check-area { width: 16px; display: grid; place-items: center; }

        /* Grid 2 Column */
        .form-grid-2col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px 24px;
        }

        /* Checkbox Grid (แก้เรื่องสั่น) */
        .checkbox-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
          background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;
        }
        .custom-checkbox-label {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          font-size: 0.85rem; color: #374151; font-weight: 500;
          margin: 0; padding: 0; line-height: 1;
        }
        .custom-checkbox-label input[type="checkbox"] {
          margin: 0; padding: 0;
          width: 16px; height: 16px; accent-color: #7c3aed; cursor: pointer;
        }

        /* Responsive */
        @media (max-width: 920px) {
          .form-grid-2col { grid-template-columns: 1fr; }
          .checkbox-grid { grid-template-columns: 1fr; }
          .form-body { padding: 16px; }
        }
      `}</style>
    </div>
  );
}

export default IdeaBase;
