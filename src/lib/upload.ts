import { supabase } from "./supabase";
export async function uploadQuestionImage(file: File){
  console.log("Starting uploadQuestionImage for:", file.name);
  const path = `q-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("question-media").upload(path, file);
  if (error) {
    console.error("Upload error (question-media):", error);
    throw error;
  }
  const { data } = supabase.storage.from("question-media").getPublicUrl(path);
  console.log("Upload success, public URL:", data.publicUrl);
  return data.publicUrl as string;
}

export async function uploadTestImage(file: File){
  console.log("Starting uploadTestImage for:", file.name);
  const path = `t-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("test-media").upload(path, file);
  if (error) {
    console.error("Upload error (test-media):", error);
    throw error;
  }
  const { data } = supabase.storage.from("test-media").getPublicUrl(path);
  console.log("Upload success, public URL:", data.publicUrl);
  return data.publicUrl as string;
}

export async function uploadOptionImage(file: File){
  console.log("Starting uploadOptionImage for:", file.name);
  const path = `o-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("question-media").upload(path, file);
  if (error) {
    console.error("Upload error (option in question-media):", error);
    throw error;
  }
  const { data } = supabase.storage.from("question-media").getPublicUrl(path);
  console.log("Upload success, public URL:", data.publicUrl);
  return data.publicUrl as string;
}
