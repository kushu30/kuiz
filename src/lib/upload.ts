import { supabase } from "./supabase";
export async function uploadQuestionImage(file: File){
  const path = `q-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("question-media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("question-media").getPublicUrl(path);
  return data.publicUrl as string;
}

export async function uploadTestImage(file: File){
  const path = `t-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("test-media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("test-media").getPublicUrl(path);
  return data.publicUrl as string;
}

export async function uploadOptionImage(file: File){
  const path = `o-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("question-media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("question-media").getPublicUrl(path);
  return data.publicUrl as string;
}
