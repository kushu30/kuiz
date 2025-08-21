import { supabase } from "./supabase";
export async function uploadQuestionImage(file: File){
  const path = `q-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("question-media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("question-media").getPublicUrl(path);
  return data.publicUrl as string;
}
