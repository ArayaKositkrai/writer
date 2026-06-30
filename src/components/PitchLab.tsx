import { ArrowLeft, ArrowRight, Check, CircleAlert, Copy, LoaderCircle, Pencil, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildPitchIdeaSignature, buildPitchPrompt, buildStoryBibleFromPitch, generatePitchOptions } from '../services/aiService';
import { AiSettings, NovelProject, PitchOption, WorkflowStep } from '../types';

interface PitchLabProps {
  project: NovelProject;
  aiSettings: AiSettings;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
  onNotice: (notice: string) => void;
}

function PitchHelpTooltip({ text }: { text: string }) {
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
        className="pitch-help-dot"
        aria-label={text}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setPosition(null)}
        onFocus={showTooltip}
        onBlur={() => setPosition(null)}
      >
        ?
      </button>
      {position && (
        <span className="pitch-floating-tooltip" style={{ left: position.left, top: position.top }} role="tooltip">
          {text}
        </span>
      )}
    </>
  );
}

function PitchLab({ project, aiSettings, updateProject, goToStep, onNotice }: PitchLabProps) {
  const currentIdeaSignature = buildPitchIdeaSignature(project);
  const hasFreshPitches = project.pitches.length > 0
    && (!project.pitchIdeaSignature || project.pitchIdeaSignature === currentIdeaSignature);
  const [prompt, setPrompt] = useState(() => hasFreshPitches && project.pitchPrompt ? project.pitchPrompt : buildPitchPrompt(project));
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(hasFreshPitches);
  const [copied, setCopied] = useState(false);
  const [editingPitch, setEditingPitch] = useState<PitchOption | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    const nextSignature = buildPitchIdeaSignature(project);
    const nextHasFreshPitches = project.pitches.length > 0
      && (!project.pitchIdeaSignature || project.pitchIdeaSignature === nextSignature);
    setPrompt(nextHasFreshPitches && project.pitchPrompt ? project.pitchPrompt : buildPitchPrompt(project));
    setShowResults(nextHasFreshPitches);
    setEditingPitch(null);
    setAiError('');
  }, [project.id]);

  useEffect(() => {
    if (!project.pitches.length || project.pitchIdeaSignature) return;
    updateProject((current) => ({
      ...current,
      pitchPrompt: current.pitchPrompt || buildPitchPrompt(current),
      pitchIdeaSignature: buildPitchIdeaSignature(current),
    }));
  }, [project.id, project.pitches.length, project.pitchIdeaSignature]);

  function showAiError(error: unknown, fallback: string) {
    const message = error instanceof Error ? error.message : fallback;
    setAiError(message);
    onNotice(message);
    window.requestAnimationFrame(() => document.getElementById('pitch-ai-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  async function generatePlots() {
    setIsGenerating(true);
    setAiError('');
    setEditingPitch(null);
    try {
      const { options, job } = await generatePitchOptions(project, prompt, aiSettings);
      updateProject(
        (current) => ({
          ...current,
          selectedPitchId: undefined,
          pitches: options,
          pitchPrompt: prompt,
          pitchIdeaSignature: buildPitchIdeaSignature(current),
          jobs: [...current.jobs, job],
        }),
        'ประมวลผล Prompt และสร้างโครงเรื่อง 3 แนวทางแล้ว',
      );
      setShowResults(true);
    } catch (error) {
      showAiError(error, 'สร้างโครงเรื่องไม่สำเร็จ');
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function openPitchEditor(pitch: PitchOption) {
    setEditingPitch({ ...pitch });
    window.requestAnimationFrame(() => {
      document.getElementById('pitch-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function updateEditingPitch(field: keyof Pick<PitchOption, 'title' | 'hook' | 'style' | 'risk'>, value: string) {
    setEditingPitch((current) => (current ? { ...current, [field]: value } : current));
  }

  async function confirmPitch() {
    if (!editingPitch) return;
    setIsConfirming(true);
    setAiError('');
    try {
      const { bible, chapters, job } = await buildStoryBibleFromPitch(project, editingPitch, aiSettings);
      updateProject(
        (current) => ({
          ...current,
          selectedPitchId: editingPitch.id,
          pitches: current.pitches.map((item) =>
            item.id === editingPitch.id ? { ...editingPitch, selected: true } : { ...item, selected: false },
          ),
          bible,
          chapters,
          currentChapterId: chapters[0]?.id ?? current.currentChapterId,
          jobs: [...current.jobs, job],
        }),
        'บันทึกโครงเรื่องและเปิด Story Bible สำหรับแก้ไขแล้ว',
      );
      goToStep('bible');
    } catch (error) {
      showAiError(error, 'สร้าง Story Bible ไม่สำเร็จ');
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="pitch-step-wrapper">
      <div className="pitch-step-card">
        <header className="pitch-step-header">
          <div className="pitch-header-title">
            <span className="step-badge">STEP 2</span>
            <Sparkles className="pitch-header-icon" size={22} />
            <div>
              <h2>เลือกโครงเรื่อง</h2>
              <p>ปรับ Prompt สร้าง 3 แนวทาง แล้วแก้ไขโครงที่เลือกก่อนนำไปพัฒนาต่อ</p>
            </div>
          </div>
          {/* <button type="button" className="secondary-button flow-back-button" onClick={() => goToStep('idea')}>
            <ArrowLeft size={17} /> กลับไป Step 1: ตั้งค่าเรื่อง
          </button> */}
        </header>

        <div className="pitch-step-body">
          {aiError && <div id="pitch-ai-error" className="pitch-ai-error" role="alert"><CircleAlert size={18} /><span>{aiError}</span></div>}
          <section className="pitch-form-section" aria-labelledby="pitch-prompt-title">
            <div className="pitch-section-heading">
              <div>
                <div className="pitch-label-row">
                  <h3 id="pitch-prompt-title">Prompt สำหรับสร้างโครงเรื่อง</h3>
                  <PitchHelpTooltip text="ระบบเตรียม Prompt จากข้อมูลใน Step 1 คุณสามารถพิมพ์แก้ไขรายละเอียดในช่องนี้ก่อนให้ AI ประมวลผล" />
                </div>
                <p>ตรวจและแก้คำสั่งให้ตรงกับทิศทางที่ต้องการก่อนสร้างโครงเรื่อง</p>
              </div>
            </div>

            <textarea
              className="pitch-prompt-input"
              value={prompt}
              onChange={(event) => {
                const value = event.target.value;
                setPrompt(value);
                setShowResults(Boolean(
                  project.pitches.length
                  && project.pitchIdeaSignature === currentIdeaSignature
                  && value === project.pitchPrompt,
                ));
                setEditingPitch(null);
              }}
              rows={10}
              aria-label="Prompt สำหรับสร้างโครงเรื่อง"
            />

            <div className="pitch-prompt-footer">
              <span>กดประมวลผลเมื่อ Prompt พร้อม ระบบจะแทนที่ผลลัพธ์ชุดเดิม</span>
              <button
                type="button"
                className="accent-button pitch-generate-button"
                onClick={generatePlots}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
                {isGenerating ? 'กำลังประมวลผล...' : 'ประมวลผลและสร้าง 3 โครงเรื่อง'}
              </button>
            </div>
          </section>

          {showResults && (
            <section className="pitch-form-section pitch-result-section" aria-labelledby="pitch-results-title">
              <div className="pitch-section-heading result-heading">
                <div>
                  <div className="pitch-label-row">
                    <h3 id="pitch-results-title">โครงเรื่องที่ AI เสนอ</h3>
                    <PitchHelpTooltip text="เปรียบเทียบแนวทางของทั้ง 3 โครง แล้วกดเลือกโครงที่ต้องการเพื่อเปิดฟอร์มแก้ไขก่อนเข้าสู่ Step 3" />
                  </div>
                  <p>เลือกหนึ่งโครงเพื่อปรับชื่อเรื่อง เนื้อหา แนวทางการเล่า และข้อควรระวัง</p>
                </div>
                <span className="result-count">{project.pitches.length} ตัวเลือก</span>
              </div>

              <div className="pitch-grid">
                {project.pitches.map((pitch, index) => (
                  <article key={pitch.id} className={editingPitch?.id === pitch.id ? 'pitch-card editing' : 'pitch-card'}>
                    <div className="pitch-meta">
                      <span>ตัวเลือก {index + 1}</span>
                      {editingPitch?.id === pitch.id && <Pencil size={16} />}
                    </div>
                    <h3>{pitch.title}</h3>
                    <p>{pitch.hook}</p>
                    <dl className="pitch-details">
                      <div>
                        <dt>แนวทางการเล่า</dt>
                        <dd>{pitch.style}</dd>
                      </div>
                      <div>
                        <dt>จุดที่ต้องระวัง</dt>
                        <dd>{pitch.risk}</dd>
                      </div>
                    </dl>
                    <button className="secondary-button pitch-select-button" onClick={() => openPitchEditor(pitch)}>
                      <Pencil size={16} />
                      เลือกและแก้ไขโครงนี้
                    </button>
                  </article>
                ))}
              </div>

              {editingPitch && (
                <section id="pitch-editor" className="pitch-editor-panel" aria-labelledby="pitch-editor-title">
                  <div className="pitch-editor-header">
                    <div>
                      <h3 id="pitch-editor-title">แก้ไขโครงเรื่องที่เลือก</h3>
                      <p>ตรวจและปรับรายละเอียดก่อนบันทึกไปยัง Story Bible ใน Step 3</p>
                    </div>
                    <button type="button" className="icon-button" onClick={() => setEditingPitch(null)} aria-label="ปิดฟอร์มแก้ไข">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="pitch-editor-grid">
                    <label className="pitch-editor-field wide">
                      ชื่อโครงเรื่อง
                      <input value={editingPitch.title} onChange={(event) => updateEditingPitch('title', event.target.value)} />
                    </label>
                    <label className="pitch-editor-field wide">
                      เนื้อเรื่องย่อและจุดดึงดูด
                      <textarea rows={4} value={editingPitch.hook} onChange={(event) => updateEditingPitch('hook', event.target.value)} />
                    </label>
                    <label className="pitch-editor-field">
                      แนวทางการเล่า
                      <textarea rows={3} value={editingPitch.style} onChange={(event) => updateEditingPitch('style', event.target.value)} />
                    </label>
                    <label className="pitch-editor-field">
                      จุดที่ต้องระวัง
                      <textarea rows={3} value={editingPitch.risk} onChange={(event) => updateEditingPitch('risk', event.target.value)} />
                    </label>
                  </div>

                  <div className="pitch-editor-actions">
                    <button type="button" className="secondary-button" onClick={() => setEditingPitch(null)}>ยกเลิก</button>
                    <button type="button" className="accent-button pitch-confirm-button" onClick={confirmPitch} disabled={!editingPitch.title.trim() || !editingPitch.hook.trim() || isConfirming}>
                      {isConfirming ? <><LoaderCircle className="spin" size={17} /> กำลังสร้าง Story Bible...</> : <>บันทึกและไป Step 3 <ArrowRight size={17} /></>}
                    </button>
                  </div>
                </section>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default PitchLab;
