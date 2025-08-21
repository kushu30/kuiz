import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { FiBarChart2 } from "react-icons/fi";
import { Share2, Trash2, Edit3 } from "lucide-react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import ShareModal from "@/components/ShareModal";

const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function AdminTests() {
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [showScore, setShowScore] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("tests")
      .select("id,title,code,created_at")
      .eq("created_by", user?.id)
      .order("created_at", { ascending: false });
    setItems(data || []);
  }

  useEffect(() => { 
    if (user && !loading) load(); 
  }, [user, loading]);

  async function createTest(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const code = makeCode();
    const { error } = await supabase.from("tests").insert({
      title,
      duration_minutes: duration,
      show_score: showScore,
      is_public: true,
      code,
      created_by: user.id,
    });
    if (!error) {
      setTitle(""); 
      setDuration(30); 
      setShowScore(true);
      load();
    }
  }

  if (loading) return <main className="p-6">Loading…</main>;
  if (!user) return <main className="p-6">Please sign in.</main>;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Your Quizzes</h1>

      {/* Create Form */}
      <form onSubmit={createTest} className="grid gap-3 max-w-md">
        <input
          className="border rounded px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="number"
          className="border rounded px-3 py-2"
          placeholder="Duration (min)"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value || "0"))}
          min={1}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showScore}
            onChange={(e) => setShowScore(e.target.checked)}
          />
          Show final score to participant
        </label>
        <Button className="w-fit">Create</Button>
      </form>

      {/* List */}
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-neutral-50"
          >
            <div className="flex flex-col">
              <div className="font-medium">{it.title}</div>
              <div className="text-xs text-slate-500">
                Code: {it.code}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShareUrl(`${window.location.origin}/join?code=${it.code}`);
                  setShareOpen(true);
                }}
                title="Share"
                className="p-2 rounded hover:bg-neutral-100"
              >
                <Share2 size={16} />
              </button>

              <Link 
                to={`/admin/tests/${it.id}`} 
                title="Edit" 
                className="p-2 rounded hover:bg-neutral-100"
              >
                <Edit3 size={16} />
              </Link>

              <Link to={`/admin/results/${it.id}`} title="View Results" className="p-2 rounded hover:bg-neutral-100">
                <FiBarChart2 className="w-4 h-4" />
              </Link>

              <button
                onClick={() => {
                  setDeleteId(it.id);
                  setDeleteOpen(true);
                }}
                title="Delete"
                className="p-2 rounded hover:bg-neutral-100 text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div>No quizzes yet.</div>}
      </div>

      {/* Share Modal */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} link={shareUrl} />


      {/* Delete Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Test"
        onConfirm={async () => {
          if (!deleteId) return;
          await supabase.from("tests").delete().eq("id", deleteId);
          setDeleteId(null);
          setDeleteOpen(false);
          load();
        }}
      >
        Are you sure you want to delete this test?
      </Dialog>
    </main>
  );
}