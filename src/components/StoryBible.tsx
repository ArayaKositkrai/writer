import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { createId } from '../data/defaultProject';
import { CharacterProfile, NovelProject, StoryBible as StoryBibleData, WorkflowStep } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface StoryBibleProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function BibleHelpTooltip({ text }: { text: string }) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  function showTooltip(event: React.SyntheticEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      left: Math.min(Math.max(rect.left + rect.width / 2, 150), window.innerWidth - 150),
      top: rect.top - 10,
    });
  }

  return (
    <>
      <button
        type="button"
        className="bible-help-dot"
        aria-label={text}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setPosition(null)}
        onFocus={showTooltip}
        onBlur={() => setPosition(null)}
      >
        ?
      </button>
      {position && (
        <span className="bible-floating-tooltip" style={{ left: position.left, top: position.top }} role="tooltip">
          {text}
        </span>
      )}
    </>
  );
}

function StoryBible({ project, updateProject, goToStep }: StoryBibleProps) {
  const [characterPendingDelete, setCharacterPendingDelete] = useState<CharacterProfile | null>(null);
  const bible = project.bible;

  function updateBibleField(field: keyof Pick<StoryBibleData, 'premise' | 'worldRules' | 'styleGuide'>, value: string) {
    updateProject((current) => ({
      ...current,
      bible: { ...current.bible, [field]: value },
    }));
  }

  function updateList(field: keyof Pick<StoryBibleData, 'timeline' | 'mysteries' | 'canonMemory'>, value: string) {
    updateProject((current) => ({
      ...current,
      bible: {
        ...current.bible,
        [field]: value.split('\n').map((item) => item.trim()).filter(Boolean),
      },
    }));
  }

  function updateCharacter(id: string, field: keyof Omit<CharacterProfile, 'id'>, value: string) {
    updateProject((current) => ({
      ...current,
      bible: {
        ...current.bible,
        characters: current.bible.characters.map((character) =>
          character.id === id ? { ...character, [field]: value } : character,
        ),
      },
    }));
  }

  function addCharacter() {
    updateProject((current) => ({
      ...current,
      bible: {
        ...current.bible,
        characters: [
          ...current.bible.characters,
          {
            id: createId('char'),
            name: 'ตัวละครใหม่',
            role: '',
            goal: '',
            conflict: '',
            arc: '',
          },
        ],
      },
    }), 'เพิ่มตัวละครใหม่แล้ว');
  }

  function deleteCharacter(id: string) {
    updateProject((current) => ({
      ...current,
      bible: {
        ...current.bible,
        characters: current.bible.characters.filter((character) => character.id !== id),
      },
    }), 'ลบตัวละครแล้ว');
    setCharacterPendingDelete(null);
  }

  return (
    <div className="story-step-wrapper">
      <div className="story-step-card">
        <header className="story-step-header">
          <div className="story-header-title">
            <span className="step-badge">STEP 3</span>
            <BookOpen className="story-header-icon" size={22} />
            <div>
              <h2>Story Bible</h2>
              <p>ตรวจและแก้ข้อมูลแกนกลางที่ทุกตอนของนิยายต้องยึดตาม</p>
            </div>
          </div>
          <div className="story-header-actions">
            <span className="story-save-state"><CheckCircle2 size={15} /> บันทึกอัตโนมัติ</span>
            {/* <button type="button" className="secondary-button flow-back-button" onClick={() => goToStep('pitch')}>
              <ArrowLeft size={17} /> กลับไป Step 2
            </button> */}
            <button type="button" className="story-next-button" onClick={() => goToStep('board')}>
              ถัดไป : Step 4 เลือกตอน
              <ArrowRight size={17} />
            </button>
          </div>
        </header>

        <div className="story-step-body">
          <section className="story-form-section" aria-labelledby="story-core-title">
            <div className="story-section-heading">
              <div>
                <div className="story-label-row">
                  <h3 id="story-core-title">แกนหลักของเรื่อง</h3>
                  <BibleHelpTooltip text="กำหนดแก่นเรื่อง กฎของโลก และแนวทางภาษาให้ชัด ข้อมูลส่วนนี้จะควบคุมความสอดคล้องของเนื้อหาทุกตอน" />
                </div>
                <p>สรุปสิ่งที่เรื่องนี้ต้องรักษาไว้ตลอดทั้งเรื่อง</p>
              </div>
            </div>

            <div className="story-form-grid">
              <label className="story-field wide">
                <span className="story-label-row">Premise <BibleHelpTooltip text="สรุปว่าใครต้องการอะไร ต้องเผชิญอุปสรรคใด และเดิมพันหลักของเรื่องคืออะไร" /></span>
                <textarea rows={4} value={bible.premise} onChange={(event) => updateBibleField('premise', event.target.value)} />
              </label>
              <label className="story-field">
                <span className="story-label-row">กฎของโลก <BibleHelpTooltip text="ระบุกฎ ระบบพลัง ข้อจำกัด สังคม หรือเงื่อนไขที่ห้ามขัดกันในภายหลัง" /></span>
                <textarea rows={7} value={bible.worldRules} onChange={(event) => updateBibleField('worldRules', event.target.value)} />
              </label>
              <label className="story-field">
                <span className="story-label-row">Style Guide <BibleHelpTooltip text="กำหนดน้ำเสียง มุมมองการเล่า จังหวะภาษา และรูปแบบบทสนทนาที่ต้องการ" /></span>
                <textarea rows={7} value={bible.styleGuide} onChange={(event) => updateBibleField('styleGuide', event.target.value)} />
              </label>
            </div>
          </section>

          <section className="story-form-section story-bordered-section" aria-labelledby="story-structure-title">
            <div className="story-section-heading">
              <div>
                <div className="story-label-row">
                  <h3 id="story-structure-title">โครงสร้างและความต่อเนื่อง</h3>
                  <BibleHelpTooltip text="ใส่หนึ่งรายการต่อหนึ่งบรรทัด ระบบจะใช้ข้อมูลนี้ตรวจลำดับเหตุการณ์ ปม และข้อเท็จจริงของเรื่อง" />
                </div>
                <p>จัดลำดับเหตุการณ์ ปมที่ต้องเฉลย และความจริงที่ห้ามเปลี่ยน</p>
              </div>
            </div>

            <div className="story-form-grid three-columns">
              <label className="story-field">
                Timeline
                <textarea rows={9} value={bible.timeline.join('\n')} onChange={(event) => updateList('timeline', event.target.value)} placeholder="หนึ่งเหตุการณ์ต่อหนึ่งบรรทัด" />
              </label>
              <label className="story-field">
                ปมสำคัญ
                <textarea rows={9} value={bible.mysteries.join('\n')} onChange={(event) => updateList('mysteries', event.target.value)} placeholder="หนึ่งปมต่อหนึ่งบรรทัด" />
              </label>
              <label className="story-field">
                Canon Memory
                <textarea rows={9} value={bible.canonMemory.join('\n')} onChange={(event) => updateList('canonMemory', event.target.value)} placeholder="หนึ่งข้อเท็จจริงต่อหนึ่งบรรทัด" />
              </label>
            </div>
          </section>

          <section className="story-form-section story-bordered-section" aria-labelledby="story-characters-title">
            <div className="story-section-heading">
              <div>
                <div className="story-label-row">
                  <h3 id="story-characters-title">ตัวละคร</h3>
                  <BibleHelpTooltip text="กำหนดบทบาท เป้าหมาย ความขัดแย้ง และพัฒนาการของตัวละครแต่ละคนให้แยกจากกันอย่างชัดเจน" />
                </div>
                <p>รายละเอียดที่ใช้ควบคุมแรงจูงใจและพัฒนาการของตัวละคร</p>
              </div>
              <button type="button" className="secondary-button story-add-character" onClick={addCharacter}>
                <Plus size={16} />
                เพิ่มตัวละคร
              </button>
            </div>

            {bible.characters.length === 0 ? (
              <div className="story-empty-characters">
                <p>ยังไม่มีตัวละครใน Story Bible</p>
                <button type="button" className="secondary-button" onClick={addCharacter}><Plus size={16} /> เพิ่มตัวละครแรก</button>
              </div>
            ) : (
              <div className="story-character-grid">
                {bible.characters.map((character, index) => (
                  <article className="story-character-card" key={character.id}>
                    <div className="story-character-top">
                      <span>ตัวละคร {index + 1}</span>
                      <button type="button" className="story-delete-character" onClick={() => setCharacterPendingDelete(character)} aria-label={`ลบ ${character.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <label className="story-field">
                      ชื่อตัวละคร
                      <input value={character.name} onChange={(event) => updateCharacter(character.id, 'name', event.target.value)} />
                    </label>
                    <div className="story-character-fields">
                      <label className="story-field">
                        บทบาท
                        <input value={character.role} onChange={(event) => updateCharacter(character.id, 'role', event.target.value)} placeholder="เช่น ตัวเอก ผู้ช่วย คู่แข่ง" />
                      </label>
                      <label className="story-field">
                        เป้าหมาย
                        <textarea rows={3} value={character.goal} onChange={(event) => updateCharacter(character.id, 'goal', event.target.value)} />
                      </label>
                      <label className="story-field">
                        ความขัดแย้ง
                        <textarea rows={3} value={character.conflict} onChange={(event) => updateCharacter(character.id, 'conflict', event.target.value)} />
                      </label>
                      <label className="story-field">
                        Character Arc
                        <textarea rows={3} value={character.arc} onChange={(event) => updateCharacter(character.id, 'arc', event.target.value)} />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(characterPendingDelete)}
        title="ยืนยันการลบตัวละคร"
        description={characterPendingDelete ? `ต้องการลบ “${characterPendingDelete.name || 'ตัวละครนี้'}” ออกจาก Story Bible หรือไม่?` : ''}
        onCancel={() => setCharacterPendingDelete(null)}
        onConfirm={() => characterPendingDelete && deleteCharacter(characterPendingDelete.id)}
      />
    </div>
  );
}

export default StoryBible;
