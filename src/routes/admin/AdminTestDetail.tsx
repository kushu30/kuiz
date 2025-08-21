import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadQuestionImage } from "@/lib/upload";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

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

  // create question (manual)
  const [body, setBody] = useState("");
  const [type, setType] = useState<"mcq"|"text">("mcq");
  const [media, setMedia] = useState<File|null>(null);
  const [options, setOptions] = useState([{label:"A",text:""},{label:"B",text:""},{label:"C",text:""},{label:"D",text:""}]);
  const [correct, setCorrect] = useState("A");
  const [textAccepted, setTextAccepted] = useState<string>("");

  // AI
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [count, setCount] = useState(5);
  const [mix, setMix] = useState<"mcq_text"|"mcq_only"|"text_only">("mcq_text");
  const [drafts, setDrafts] = useState<DraftQ[]>([]);
  const [busyGen, setBusyGen] = useState(false);
  const [err, setErr] = useState("");

  // edit existing question
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
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
  useEffect(()=>{ load(); }, [testId]);

  // ---- Manual add
  async function addQuestion(e: React.FormEvent){
    e.preventDefault();
    let media_url: string | null = null;
    if (media) media_url = await uploadQuestionImage(media);

    const text_policy = type === "text"
      ? { accepted: textAccepted.split(",").map(s=> s.trim()).filter(Boolean) }
      : null;

    const { data: q, error } = await supabase.from("questions")
      .insert({ test_id: testId, body, type, media_url, order_index: (qs.length+1), points: 1, text_policy })
      .select("id").single();
    if (error) { setErr(error.message); return; }

    if (type === "mcq" && q) {
      await supabase.from("options").insert(
        options.map(o => ({ question_id: q.id, label: o.label, text: o.text, is_correct: o.label === correct }))
      );
    }
    setBody(""); setMedia(null);
    setOptions([{label:"A",text:""},{label:"B",text:""},{label:"C",text:""},{label:"D",text:""}]);
    setCorrect("A");
    setTextAccepted("");
    load();
  }

  // ---- AI generate
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

    // Insert sequentially to keep order_index correct
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
      // update local order reference
      qs.push({ id: q?.id, body: d.body, type: d.type, media_url: null, order_index: qs.length+1, points: d.points ?? 1 });
    }
    setDrafts([]);
    await load();
  }

  // ---- Edit existing
  async function startEdit(q: any){
    setEditingId(q.id);
    setEditBody(q.body);
    setEditType(q.type);
    setEditMedia(null);
    
    // fetch text policy if text question
    if (q.type === "text") {
      const { data: qr } = await supabase.from("questions").select("text_policy").eq("id", q.id).single();
      setEditAccepted((qr?.text_policy?.accepted || []).join(", "));
    } else {
      setEditAccepted("");
    }
    
    // fetch options if mcq
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
    if (!editingId) return;
    let media_url: string | null | undefined = undefined; // undefined = no change
    if (editMedia) {
      media_url = await uploadQuestionImage(editMedia);
    }
    const update: any = { body: editBody.trim(), type: editType };
    if (media_url !== undefined) update.media_url = media_url;

    if (editType === "text") {
      update.text_policy = {
        accepted: editAccepted.split(",").map(s=> s.trim()).filter(Boolean)
      };
    } else {
      update.text_policy = null;
    }

    await supabase.from("questions").update(update).eq("id", editingId);

    // rewrite options if mcq
    if (editType === "mcq") {
      // delete existing then insert
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
      // delete any options for text type
      await supabase.from("options").delete().eq("question_id", editingId);
    }

    setEditingId(null);
    setEditMedia(null);
    await load();
  }

  // ---- Reorder
  async function move(id: string, dir: "up"|"down"){
    const idx = qs.findIndex(q => q.id === id);
    if (idx < 0) return;
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= qs.length) return;

    const A = qs[idx], B = qs[swapWith];
    // swap order_index
    await Promise.all([
      supabase.from("questions").update({ order_index: B.order_index }).eq("id", A.id),
      supabase.from("questions").update({ order_index: A.order_index }).eq("id", B.id),
    ]);
    await load();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-xl font-semibold">Manage Questions</h1>

      {/* AI generator */}
      <Card>
        <CardHeader title="Generate with AI" subtitle="Draft questions using Gemini Flash, then review & save." />
        <CardBody className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Topic (e.g., Basic SQL Joins)" value={topic} onChange={e=>setTopic(e.target.value)} />
            <Input placeholder="Intended audience (e.g., 1st-year CS)" value={audience} onChange={e=>setAudience(e.target.value)} />
            <Input type="number" min={1} max={20} placeholder="Count" value={count} onChange={e=>setCount(parseInt(e.target.value||"0"))} />
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
              <Button onClick={saveSelectedDrafts} className="bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50">
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

      {/* Manual add */}
      <Card>
        <CardHeader title="Add Question (manual)" />
        <CardBody className="grid gap-3 max-w-xl">
          <Textarea placeholder="Question text" value={body} onChange={e=>setBody(e.target.value)} />
          <label className="text-sm flex items-center gap-2">
            Type:
            <select value={type} onChange={e=>setType(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="mcq">MCQ</option>
              <option value="text">Text input</option>
            </select>
          </label>
          <label className="text-sm">
            Image (optional): <input type="file" accept="image/*" onChange={e=>setMedia(e.target.files?.[0] || null)} />
          </label>
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
          <Button onClick={addQuestion}>Add Question</Button>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </CardBody>
      </Card>

      {/* Existing questions list */}
      <div className="grid gap-3">
        {qs.map(q=>(
          <Card key={q.id}>
            <CardBody className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{q.order_index}. {q.body} <span className="text-xs text-neutral-500">({q.type})</span></div>
                <div className="flex gap-2">
                  <button className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50" onClick={()=>move(q.id,"up")}>↑</button>
                  <button className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50" onClick={()=>move(q.id,"down")}>↓</button>
                  <button className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50" onClick={()=>startEdit(q)}>Edit</button>
                </div>
              </div>

              {editingId === q.id && (
                <div className="grid gap-2 border-t pt-3">
                  <Textarea value={editBody} onChange={e=>setEditBody(e.target.value)} />
                  <label className="text-sm flex items-center gap-2">
                    Type:
                    <select value={editType} onChange={e=>setEditType(e.target.value as any)} className="border rounded px-2 py-1">
                      <option value="mcq">MCQ</option>
                      <option value="text">Text input</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    Replace/Add Image: <input type="file" accept="image/*" onChange={e=>setEditMedia(e.target.files?.[0] || null)} />
                  </label>
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
                    <Button onClick={saveEdit}>Save</Button>
                    <Button className="bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50" onClick={()=>setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
        {qs.length === 0 && <Card><CardBody>No questions yet.</CardBody></Card>}
      </div>
    </main>
  );
}
