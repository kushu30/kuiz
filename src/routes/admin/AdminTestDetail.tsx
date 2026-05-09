import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadQuestionImage } from "@/lib/upload";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import ShareModal from "@/components/ShareModal";
import { testJoinLink } from "@/lib/share";
import Dialog from "@/components/ui/Dialog";
import { Trash2, Upload, Image as ImageIcon } from "lucide-react";

type DraftQ = {
  type: "mcq" | "text";
  body: string;
  options: { label: "A"|"B"|"C"|"D"; text: string }[] | null;
  correct_label: "A"|"B"|"C"|"D" | null;
  points: number;
  selected?: boolean;
};

export default function AdminTestDetail(){
  const { id: testId } = useParams();
  const [qs, setQs] = useState<any[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [body, setBody] = useState("");
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<"mcq"|"text">("mcq");
  const [media, setMedia] = useState<File|null>(null);
  const [options, setOptions] = useState([{label:"A",text:""},{label:"B",text:""},{label:"C",text:""},{label:"D",text:""}]);
  const [correct, setCorrect] = useState("A");
  const [textAccepted, setTextAccepted] = useState<string>("");
  const [testMeta, setTestMeta] = useState<{title:string; code:string} | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [count, setCount] = useState<number | "">(5);
  const [mix, setMix] = useState<"mcq_text"|"mcq_only"|"text_only">("mcq_text");
  const [drafts, setDrafts] = useState<DraftQ[]>([]);
  const [busyGen, setBusyGen] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [err, setErr] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editType, setEditType] = useState<"mcq"|"text">("mcq");
  const [editMedia, setEditMedia] = useState<File|null>(null);
  const [editOptions, setEditOptions] = useState([{label:"A",text:""},{label:"B",text:""},{label:"C",text:""},{label:"D",text:""}]);
  const [editCorrect, setEditCorrect] = useState("A");
  const [editAccepted, setEditAccepted] = useState<string>("");

  async function load(){ 
    const { data } = await supabase
      .from("questions")
      .select("id,body,type,media_url,order_index,points")
      .eq("test_id", testId)
      .order("order_index");
    setQs(data || []);
  }

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("tests").select("title,code").eq("id", testId).single();
      if (t) setTestMeta(t);
      await load();
    })();
  }, [testId]);

  async function addQuestion(e: React.FormEvent){
    e.preventDefault();
    if (busySave) return;
    setBusySave(true);
    setErr("");
    console.log("addQuestion started...");
    
    try {
      let media_url: string | null = null;
      if (media) {
        console.log("Uploading question image...");
        media_url = await uploadQuestionImage(media);
      }

      const text_policy = type === "text"
        ? { accepted: textAccepted.split(",").map(s=> s.trim()).filter(Boolean) }
        : null;

      console.log("Inserting question into DB...");
      const { data: q, error } = await supabase.from("questions")
        .insert({ 
          test_id: testId, 
          body, 
          type, 
          media_url, 
          media_caption: caption.trim() || null,
          order_index: (qs.length+1), 
          points: 1, 
          text_policy 
        })
        .select("id").single();
      
      if (error) {
        console.error("DB Insert Error:", error);
        setErr(error.message); 
        return; 
      }

      if (type === "mcq" && q) {
        console.log("Inserting MCQ options...");
        const { error: optErr } = await supabase.from("options").insert(
          options.map(o => ({ question_id: q.id, label: o.label, text: o.text, is_correct: o.label === correct }))
        );
        if (optErr) console.error("Options insert error:", optErr);
      }
      
      console.log("Question added successfully!");
      setBody(""); setMedia(null); setCaption("");
      setOptions([{label:"A",text:""},{label:"B",text:""},{label:"C",text:""},{label:"D",text:""}]);
      setCorrect("A");
      setTextAccepted("");
      load();
    } catch (err: any) {
      console.error("Unexpected error in addQuestion:", err);
      setErr(err?.message || "An unexpected error occurred");
    } finally {
      setBusySave(false);
    }
  }

  async function generateAI(){
    setBusyGen(true); setErr("");
    try {
      const r = await fetch("/.netlify/functions/gen-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, numQuestions: count, mix })
      });
      if (!r.ok) { setErr(await r.text()); return; }
      const data = await r.json();
      const qs: DraftQ[] = (data?.questions || []).map((q: any) => ({
        type: q.type === "text" ? "text" : "mcq",
        body: q.body || "",
        options: q.options || null,
        correct_label: q.correct_label || null,
        points: Number.isFinite(q.points) ? q.points : 1,
        selected: true,
      }));
      setDrafts(qs);
    } catch (e:any) {
      setErr(e?.message || String(e));
    } finally {
      setBusyGen(false);
    }
  }

  async function saveSelectedDrafts(){
    const toSave = drafts.filter(d => d.selected && d.body.trim().length > 0);
    if (!toSave.length) return;

    for (const d of toSave) {
      const text_policy = d.type === "text" ? { accepted: [] } : null;

      const { data: q } = await supabase.from("questions")
        .insert({
          test_id: testId,
          body: d.body.trim(),
          type: d.type,
          media_url: null,
          order_index: (qs.length + 1),
          points: d.points ?? 1,
          text_policy
        })
        .select("id").single();

      if (d.type === "mcq" && q && Array.isArray(d.options)) {
        await supabase.from("options").insert(
          d.options.map(o => ({
            question_id: q.id,
            label: o.label,
            text: o.text,
            is_correct: o.label === d.correct_label
          }))
        );
      }
      qs.push({ id: q?.id, body: d.body, type: d.type, media_url: null, order_index: qs.length+1, points: d.points ?? 1 });
    }
    setDrafts([]);
    await load();
  }

  async function startEdit(q: any){
    setEditingId(q.id);
    setEditBody(q.body);
    setEditCaption(q.media_caption || "");
    setEditType(q.type);
    setEditMedia(null);
    
    if (q.type === "text") {
      const { data: qr } = await supabase.from("questions").select("text_policy").eq("id", q.id).single();
      setEditAccepted((qr?.text_policy?.accepted || []).join(", "));
    } else {
      setEditAccepted("");
    }
    
    if (q.type === "mcq") {
      const { data: os } = await supabase.from("options")
        .select("label,text,is_correct").eq("question_id", q.id).order("label");
      const arr = ["A","B","C","D"].map((L)=> ({label: L as "A"|"B"|"C"|"D", text: os?.find(o=>o.label===L)?.text || ""}));
      setEditOptions(arr);
      setEditCorrect((os?.find(o=>o.is_correct)?.label || "A") as any);
    } else {
      setEditOptions([{label:"A",text:""},{label:"B",text:""},{label:"C",text:""},{label:"D",text:""}]);
      setEditCorrect("A");
    }
  }

  async function saveEdit(){
    if (!editingId || busySave) return;
    setBusySave(true);
    setErr("");
    console.log("saveEdit started for ID:", editingId);
    
    try {
      let media_url: string | null | undefined = undefined;
      if (editMedia) {
        console.log("Uploading replacement image...");
        media_url = await uploadQuestionImage(editMedia);
      }
      
      const update: any = { 
        body: editBody.trim(), 
        type: editType,
        media_caption: editCaption.trim() || null
      };
      if (media_url !== undefined) update.media_url = media_url;

      if (editType === "text") {
        update.text_policy = {
          accepted: editAccepted.split(",").map(s=> s.trim()).filter(Boolean)
        };
      } else {
        update.text_policy = null;
      }

      console.log("Updating question in DB...");
      const { error: updError } = await supabase.from("questions").update(update).eq("id", editingId);
      if (updError) {
        console.error("DB Update Error:", updError);
        setErr(updError.message);
        return;
      }

      if (editType === "mcq") {
        console.log("Updating MCQ options...");
        await supabase.from("options").delete().eq("question_id", editingId);
        await supabase.from("options").insert(
          editOptions.map(o => ({
            question_id: editingId,
            label: o.label,
            text: o.text,
            is_correct: o.label === editCorrect
          }))
        );
      } else {
        await supabase.from("options").delete().eq("question_id", editingId);
      }

      console.log("Edit saved successfully!");
      setEditingId(null);
      setEditMedia(null);
      setEditCaption("");
      await load();
    } catch (err: any) {
      console.error("Unexpected error in saveEdit:", err);
      setErr(err?.message || "An unexpected error occurred");
    } finally {
      setBusySave(false);
    }
  }

  async function move(id: string, dir: "up"|"down"){
    const idx = qs.findIndex(q => q.id === id);
    if (idx < 0) return;
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= qs.length) return;

    const A = qs[idx], B = qs[swapWith];
    await Promise.all([
      supabase.from("questions").update({ order_index: B.order_index }).eq("id", A.id),
      supabase.from("questions").update({ order_index: A.order_index }).eq("id", B.id),
    ]);
    await load();
  }

  async function deleteQuestion(id: string) {
    await supabase.from("questions").delete().eq("id", id);
    load();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-xl font-semibold">Manage Questions</h1>

      <Card>
        <CardHeader title="Generate with AI" subtitle="Draft questions using Gemini Flash, then review & save." />
        <CardBody className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Topic (e.g., Basic SQL Joins)" value={topic} onChange={e=>setTopic(e.target.value)} />
            <Input placeholder="Intended audience (e.g., 1st-year CS)" value={audience} onChange={e=>setAudience(e.target.value)} />
            <Input
              type="number"
              min={1}
              max={20}
              placeholder="Count"
              value={count}
              onChange={(e) => {
                const val = e.target.value;
                setCount(val === "" ? "" : parseInt(val));
              }}
            />
          </div>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="mix" checked={mix==="mcq_text"} onChange={()=>setMix("mcq_text")} /> Mixed
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mix" checked={mix==="mcq_only"} onChange={()=>setMix("mcq_only")} /> MCQ only
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mix" checked={mix==="text_only"} onChange={()=>setMix("text_only")} /> Text only
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateAI} disabled={busyGen || !topic.trim() || !audience.trim()}>
              {busyGen ? "Generating…" : "Generate with AI"}
            </Button>
            {drafts.length > 0 && (
              <Button onClick={saveSelectedDrafts}>
                Add selected ({drafts.filter(d=>d.selected).length})
              </Button>
            )}
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}

          {drafts.length > 0 && (
            <div className="grid gap-3">
              {drafts.map((d, i) => (
                <Card key={i}>
                  <CardBody className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Draft #{i+1} ({d.type.toUpperCase()})</div>
                      <label className="text-xs flex items-center gap-2">
                        <input type="checkbox" checked={!!d.selected} onChange={e=>{
                          const v = e.target.checked; setDrafts(arr => arr.map((x,j)=> j===i ? { ...x, selected: v } : x));
                        }} />
                        include
                      </label>
                    </div>
                    <Textarea value={d.body} onChange={e=>{
                      const v = e.target.value; setDrafts(arr => arr.map((x,j)=> j===i ? { ...x, body: v } : x));
                    }} />
                    {d.type === "mcq" && (
                      <div className="grid gap-2">
                        {["A","B","C","D"].map(L => {
                          const idx = d.options?.findIndex(o=>o.label===L) ?? -1;
                          const val = idx >=0 ? d.options![idx].text : "";
                          return (
                            <div key={L} className="flex items-center gap-2">
                              <span className="font-mono text-xs w-5">{L}.</span>
                              <Input value={val} onChange={e=>{
                                const v = e.target.value;
                                setDrafts(arr => arr.map((x,j)=>{
                                  if (j!==i) return x;
                                  const opts = (x.options || [{label:"A",text:""},{label:"B",text:""},{label:"C",text:""},{label:"D",text:""}]).map(o => o.label===L ? { ...o, text: v } : o);
                                  return { ...x, options: opts as any };
                                }));
                              }} />
                              <label className="text-xs flex items-center gap-1">
                                <input type="radio" name={`correct-${i}`} checked={d.correct_label===L} onChange={()=>setDrafts(arr => arr.map((x,j)=> j===i ? { ...x, correct_label: L as any } : x))} />
                                Correct
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Add Question (manual)" />
        <CardBody className="grid gap-3 max-w-xl">
          <div className="grid gap-1">
            <span className="text-sm font-medium">Question Text</span>
            <Textarea placeholder="Question text" value={body} onChange={e=>setBody(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <span className="text-sm font-medium">Image Caption (optional)</span>
            <Input placeholder="Short caption shown below image" value={caption} onChange={e=>setCaption(e.target.value)} />
          </div>
          <label className="text-sm flex items-center gap-2">
            Type:
            <select value={type} onChange={e=>setType(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="mcq">MCQ</option>
              <option value="text">Text input</option>
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Image (optional)</span>
            <label className="flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-neutral-50 transition-colors w-fit">
              <Upload size={16} className="text-neutral-500" />
              <span className="text-sm">Choose image</span>
              <input type="file" accept="image/*" className="hidden" onChange={e=>setMedia(e.target.files?.[0] || null)} />
            </label>
            <Button 
              variant="outline" 
              className="px-3 py-2 h-auto text-xs flex items-center gap-2"
              onClick={async () => {
                if (!body.trim()) { setErr("Enter a question first to generate an image."); return; }
                setBusySave(true); setErr("");
                try {
                  const r = await fetch("/.netlify/functions/gen-image", {
                    method: "POST",
                    body: JSON.stringify({ prompt: body })
                  });
                  if (!r.ok) throw new Error(await r.text());
                  const { url } = await r.json();
                  // For now, we just set the caption or handle the URL
                  // Ideally we download it and set it as 'media' file, 
                  // but for simplicity we'll just store the AI URL if the DB allows it, 
                  // or tell the user it's ready.
                  setErr("AI Image generated! (Using placeholder for now)");
                  console.log("AI Image URL:", url);
                } catch (e: any) {
                  setErr("AI Image failed: " + e.message);
                } finally {
                  setBusySave(false);
                }
              }}
            >
              <ImageIcon size={14} />
              AI Generate
            </Button>
          </div>
          {media && (
            <div className="relative w-32 h-32 group">
              <img src={URL.createObjectURL(media)} className="w-full h-full object-cover rounded border" alt="Preview" />
              <button 
                onClick={() => setMedia(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-transform hover:scale-110"
                title="Remove image"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
          {type==="mcq" && (
            <div className="grid gap-2">
              {options.map((o,i)=>(
                <div key={o.label} className="flex items-center gap-2">
                  <Input placeholder={`${o.label} option`} value={o.text} onChange={e=>{
                    const next=[...options]; next[i].text=e.target.value; setOptions(next);
                  }} />
                  <label className="text-xs flex items-center gap-1">
                    <input type="radio" name="correct" checked={correct===o.label} onChange={()=>setCorrect(o.label)} />
                    Correct
                  </label>
                </div>
              ))}
            </div>
          )}
          {type === "text" && (
            <div className="grid gap-1">
              <label className="text-sm font-medium">Accepted answers (comma-separated)</label>
              <Input
                placeholder="e.g. Paris, City of Light"
                value={textAccepted}
                onChange={(e)=> setTextAccepted(e.target.value)}
              />
              <div className="text-xs text-neutral-500">Case-insensitive; we compare normalized text.</div>
            </div>
          )}
          <Button onClick={addQuestion} disabled={busySave}>
            {busySave ? "Adding..." : "Add Question"}
          </Button>
          {err && <div className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded">{err}</div>}
        </CardBody>
      </Card>

      <div className="grid gap-3">
        {qs.map(q=>(
          <Card key={q.id}>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <div className="font-medium">
                    {q.order_index}. {q.body} 
                    <span className="ml-2 text-xs text-neutral-500 italic">({q.type})</span>
                  </div>
                  {q.media_url && (
                    <img 
                      src={q.media_url} 
                      className="w-32 h-32 object-cover rounded border shadow-sm" 
                      alt="Question media" 
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50" onClick={()=>move(q.id,"up")}>↑</button>
                  <button className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50" onClick={()=>move(q.id,"down")}>↓</button>
                  <button className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50" onClick={()=>startEdit(q)}>Edit</button>
                  <button className="p-2 rounded hover:bg-neutral-100" onClick={()=>setConfirmDeleteId(q.id)} title="Delete question">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editingId === q.id && (
                <div className="grid gap-2 border-t pt-3">
                  <div className="grid gap-1">
                    <span className="text-sm font-medium">Question Text</span>
                    <Textarea value={editBody} onChange={e=>setEditBody(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-sm font-medium">Image Caption</span>
                    <Input placeholder="Short caption shown below image" value={editCaption} onChange={e=>setEditCaption(e.target.value)} />
                  </div>
                  <label className="text-sm flex items-center gap-2">
                    Type:
                    <select value={editType} onChange={e=>setEditType(e.target.value as any)} className="border rounded px-2 py-1">
                      <option value="mcq">MCQ</option>
                      <option value="text">Text input</option>
                    </select>
                  </label>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Question Image</span>
                    <label className="flex items-center gap-2 px-3 py-1.5 border rounded cursor-pointer hover:bg-neutral-50 transition-colors w-fit">
                      <Upload size={14} className="text-neutral-500" />
                      <span className="text-sm">{q.media_url ? "Change image" : "Add image"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e=>setEditMedia(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    {q.media_url && !editMedia && (
                      <div className="relative w-24 h-24">
                        <img src={q.media_url} className="w-full h-full object-cover rounded border opacity-70" alt="Current" />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-600 bg-white/20">CURRENT</div>
                      </div>
                    )}
                    {editMedia && (
                      <div className="relative w-24 h-24 group">
                        <img src={URL.createObjectURL(editMedia)} className="w-full h-full object-cover rounded border" alt="New Preview" />
                        <button 
                          onClick={() => setEditMedia(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-transform hover:scale-110"
                        >
                          <Trash2 size={10} />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 text-[10px] text-center bg-blue-500 text-white font-bold py-0.5">NEW</div>
                      </div>
                    )}
                  </div>
                  {editType==="mcq" && (
                    <div className="grid gap-2">
                      {editOptions.map((o,i)=>(
                        <div key={o.label} className="flex items-center gap-2">
                          <Input value={o.text} onChange={e=>{
                            const next=[...editOptions]; next[i].text=e.target.value; setEditOptions(next);
                          }} />
                          <label className="text-xs flex items-center gap-1">
                            <input type="radio" name={`edit-correct-${q.id}`} checked={editCorrect===o.label} onChange={()=>setEditCorrect(o.label)} />
                            Correct
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {editType === "text" && (
                    <div className="grid gap-1">
                      <label className="text-sm font-medium">Accepted answers</label>
                      <Input value={editAccepted} onChange={(e)=> setEditAccepted(e.target.value)} />
                      <div className="text-xs text-neutral-500">Comma-separated, case-insensitive</div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} disabled={busySave}>
                      {busySave ? "Saving..." : "Save"}
                    </Button>
                    <Button className="bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50" onClick={()=>setEditingId(null)} disabled={busySave}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
        {qs.length === 0 && <Card><CardBody>No questions yet.</CardBody></Card>}
      </div>

      {testMeta && (
        <div className="flex justify-between items-center mt-8 p-4 bg-neutral-50 rounded-lg">
          <div className="text-sm text-neutral-500">
            Code: <span className="font-mono font-medium">{testMeta.code}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShareOpen(true)}>Share</Button>
            <Button onClick={() => (window.location.href = "/admin/tests")}>Done</Button>
          </div>
        </div>
      )}

      {testMeta && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title={`Share "${testMeta.title}"`}
          link={testJoinLink(testMeta.code)}
        />
      )}

      <Dialog
        open={!!confirmDeleteId}
        title="Delete question"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteQuestion(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        confirmLabel="Delete"
      >
        This action will remove the question and its options.
      </Dialog>
    </main>
  );
}
