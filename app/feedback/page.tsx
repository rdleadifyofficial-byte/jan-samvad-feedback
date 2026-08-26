"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Camera, CheckCircle2, ChevronDown, ImagePlus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const CATEGORIES = [
  "सड़क", "पानी", "सफाई", "स्ट्रीट लाइट", "नाली",
  "सीवरेज", "स्वास्थ्य", "शिक्षा", "अतिक्रमण", "अन्य",
];

async function compressPhoto(file: File) {
  if (file.size < 1.5 * 1024 * 1024) return file;
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = sourceUrl;
    });
    const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.size >= file.size) return file;
    const outputType = ACCEPTED_PHOTO_TYPES.includes(blob.type) ? blob.type : "image/webp";
    const extension = outputType === "image/png" ? "png" : outputType === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "feedback-photo"}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function SelectField({
  id,
  name,
  value,
  onChange,
  disabled,
  placeholder,
  children,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mt-2 w-full">
      <select
        id={id}
        name={name}
        required
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full cursor-pointer appearance-none rounded-md border border-input bg-transparent px-3 pr-11 text-sm outline-none transition-shadow focus:border-ring focus:ring-[3px] focus:ring-ring/50 disabled:cursor-not-allowed disabled:bg-[#f1f1ed] disabled:opacity-80"
      >
        <option value="" disabled>{placeholder}</option>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#17352c]" />
    </div>
  );
}

export default function FeedbackPage() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [ward, setWard] = useState("");
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const queryString = useSyncExternalStore(() => () => undefined, () => window.location.search, () => "");
  const queryParams = new URLSearchParams(queryString);
  const queryWardNumber = Number(queryParams.get("ward"));
  const queryWard = Number.isInteger(queryWardNumber) && queryWardNumber >= 1 && queryWardNumber <= 45
    ? String(queryWardNumber)
    : "";
  const selectedWard = ward || queryWard;
  const wardLocked = Boolean(queryWard) && queryParams.get("lock") === "true";

  useEffect(() => {
    const update = () => setDateTime(new Date().toLocaleString("hi-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "short",
    }));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setPhotoError("");
    if (!ACCEPTED_PHOTO_TYPES.includes(selected.type)) {
      setPhotoError("केवल JPG, JPEG, PNG या WebP फोटो चुनें।");
      return;
    }
    if (selected.size > MAX_PHOTO_BYTES) {
      setPhotoError("फोटो का आकार 5 MB से अधिक नहीं होना चाहिए।");
      return;
    }
    setProcessingPhoto(true);
    try {
      const prepared = await compressPhoto(selected);
      setPhoto(prepared);
      setPreviewUrl(URL.createObjectURL(prepared));
    } catch {
      setPhotoError("फोटो तैयार नहीं हो पाई। कृपया दूसरी फोटो चुनें।");
    } finally {
      setProcessingPhoto(false);
    }
  }

  function removePhoto() {
    setPhoto(null);
    setPreviewUrl("");
    setPhotoError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      form.set("ward", selectedWard);
      form.set("category", category);
      form.set("consent", form.get("consent") === "on" ? "true" : "false");
      if (photo) form.set("photo", photo, photo.name);
      const response = await fetch("/api/feedback", { method: "POST", body: form });
      const data = await response.json();
      if (response.ok) setDone(true);
      else setError(data.error || "कृपया दोबारा प्रयास करें।");
    } catch {
      setError("नेटवर्क में समस्या है। कृपया दोबारा प्रयास करें।");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f3ea] p-5">
        <div className="max-w-md rounded-[2rem] bg-white p-10 text-center shadow-xl">
          <CheckCircle2 className="mx-auto size-14 text-[#23845d]" />
          <h1 className="mt-5 text-3xl font-semibold text-[#17352c]">फीडबैक दर्ज हो गया</h1>
          <p className="mt-3 leading-7 text-[#587068]">धन्यवाद! आपकी जानकारी सुरक्षित रूप से भेज दी गई है।</p>
          <p className="mt-4 rounded-xl bg-[#f6f3ea] p-3 text-sm font-medium text-[#587068]">{dateTime}</p>
          <p className="mt-4 text-sm text-[#587068]">अब आप यह पेज बंद कर सकते हैं।</p>
        </div>
      </main>
    );
  }

  const uploadDisabled = busy || processingPhoto;
  return (
    <main className="min-h-screen bg-[#f6f3ea] px-5 py-8 text-[#17352c]">
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => history.back()} className="inline-flex items-center gap-2 text-sm text-[#587068]">
          <ArrowLeft className="size-4" /> वापस
        </button>
        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl sm:p-10">
          <p className="text-sm font-semibold text-[#df7b2f]">जन संवाद फॉर्म</p>
          <h1 className="mt-2 text-3xl font-semibold">अपनी समस्या या सुझाव साझा करें</h1>
          <p className="mt-3 text-sm leading-6 text-[#587068]">* चिह्नित जानकारी जरूरी है। आपका मोबाइल नंबर सार्वजनिक नहीं किया जाएगा।</p>
          <div className="mt-5 rounded-xl border border-[#17352c]/10 bg-[#f6f3ea] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#df7b2f]">Automatic Date & Time</p>
            <p className="mt-1 text-sm font-medium">{dateTime || "समय लोड हो रहा है..."}</p>
          </div>
          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">नाम *</Label>
              <Input id="name" name="name" required maxLength={80} className="mt-2 h-12" placeholder="आपका नाम" />
            </div>
            <div>
              <Label htmlFor="mobile">मोबाइल नंबर *</Label>
              <Input id="mobile" name="mobile" required inputMode="tel" pattern="[+0-9 ]{10,15}" className="mt-2 h-12" placeholder="10 अंकों का नंबर" />
            </div>
            <div>
              <Label htmlFor="ward">वार्ड नंबर *</Label>
              <SelectField id="ward" name="ward" value={selectedWard} onChange={setWard} disabled={wardLocked} placeholder="वार्ड चुनें">
                {Array.from({ length: 45 }, (_, index) => index + 1).map((number) => (
                  <option key={number} value={String(number)}>वार्ड {number}</option>
                ))}
              </SelectField>
              {wardLocked && <p className="mt-1.5 text-xs text-[#587068]">यह वार्ड लिंक द्वारा निर्धारित है।</p>}
            </div>
            <div>
              <Label htmlFor="area">मोहल्ला / स्थान *</Label>
              <Input id="area" name="area" required className="mt-2 h-12" placeholder="जैसे: मुख्य बाजार" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="category">समस्या की श्रेणी *</Label>
              <SelectField id="category" name="category" value={category} onChange={setCategory} placeholder="श्रेणी चुनें">
                {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </SelectField>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="message">समस्या / सुझाव *</Label>
              <Textarea id="message" name="message" required minLength={5} maxLength={800} className="mt-2 min-h-32" placeholder="अपनी बात विस्तार से लिखें..." />
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium">समस्या की फोटो <span className="font-normal text-[#587068]">(वैकल्पिक)</span></legend>
              <p className="mt-1 text-xs text-[#587068]">JPG, PNG या WebP · अधिकतम 5 MB</p>
              <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={choosePhoto} className="sr-only" disabled={uploadDisabled} />
              <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} className="sr-only" disabled={uploadDisabled} />
              {!photo ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={uploadDisabled} onClick={() => cameraInput.current?.click()} className="h-11">
                    <Camera className="mr-2 size-4" /> Camera से फोटो लें
                  </Button>
                  <Button type="button" variant="outline" disabled={uploadDisabled} onClick={() => galleryInput.current?.click()} className="h-11">
                    <ImagePlus className="mr-2 size-4" /> Gallery से फोटो चुनें
                  </Button>
                </div>
              ) : (
                <div className="mt-3 overflow-hidden rounded-2xl border border-[#17352c]/10 bg-[#f6f3ea] p-3">
                  {/* Blob previews cannot be optimized by Next Image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="चुनी गई समस्या की फोटो" className="max-h-72 w-full rounded-xl object-contain" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={uploadDisabled} onClick={() => galleryInput.current?.click()}>
                      <ImagePlus className="mr-2 size-4" /> फोटो बदलें
                    </Button>
                    <Button type="button" variant="outline" disabled={uploadDisabled} onClick={removePhoto} className="text-red-700">
                      <Trash2 className="mr-2 size-4" /> फोटो हटाएं
                    </Button>
                  </div>
                </div>
              )}
              {processingPhoto && <p className="mt-2 text-sm text-[#587068]">फोटो तैयार हो रही है...</p>}
              {photoError && <p role="alert" className="mt-2 text-sm text-red-600">{photoError}</p>}
            </fieldset>
            <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
            <div className="flex gap-3 sm:col-span-2">
              <Checkbox id="consent" name="consent" />
              <Label htmlFor="consent" className="font-normal leading-5 text-[#587068]">जरूरत पड़ने पर इस विषय में मुझसे संपर्क किया जा सकता है।</Label>
            </div>
            {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <Button disabled={uploadDisabled} className="h-12 rounded-full bg-[#17352c] sm:col-span-2">
              {busy ? "दर्ज हो रहा है..." : <>फीडबैक भेजें <Send className="ml-2 size-4" /></>}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
