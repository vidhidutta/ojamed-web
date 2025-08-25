export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
export async function convertFile(file, onProgress){
  if(!API_URL) throw new Error("VITE_API_URL is not set");
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(API_URL + "/convert", { method: "POST", body: fd });
  if(!res.ok){
    const msg = await res.text().catch(()=> "");
    throw new Error(msg || `Upload failed (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  return blob; // ojamed_deck.zip
}

