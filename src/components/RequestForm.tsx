'use client';

import { useState, useActionState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { submitRequest, type SubmitRequestState } from '@/app/requests/actions';
import {
  CATEGORIES,
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_TYPES,
  MURANGA_CONSTITUENCIES,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  MapPin,
  FileText,
  Upload,
  X,
  AlertCircle,
  Loader2,
  Send,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';

const initialState: SubmitRequestState = {};

export function RequestForm() {
  const [state, formAction, isPending] = useActionState(submitRequest, initialState);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConstituency = MURANGA_CONSTITUENCIES.find(
    (c) => c.name === selectedConstituency
  );
  const availableWards = activeConstituency ? activeConstituency.wards : [];

  const handleConstituencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedConstituency(e.target.value);
    setSelectedWard(''); // Reset ward whenever constituency changes
  };

  // Client-side image validation & preview (for enhanced UX; server remains authoritative)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];

    if (!file) {
      clearImage();
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])
    ) {
      setImageError('Only JPEG, PNG, or WebP image formats are accepted.');
      clearImage();
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setImageError(`File size (${sizeMb} MB) exceeds the 2 MB limit.`);
      clearImage();
      return;
    }

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="shadow-lg border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          New Service Request
        </CardTitle>
        <CardDescription>
          Provide details about the municipal issue. Location and clear descriptions help dispatch field teams rapidly.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-6">
          {/* Top Form Error */}
          {state.error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* 1. Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="font-bold text-zinc-950">
              Service Category <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
                className="flex h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-950 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B34] focus-visible:ring-offset-1"
              >
                <option value="" disabled>
                  Select a category...
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Category Input if "Other" is selected */}
            {selectedCategory === 'other' && (
              <div className="space-y-1.5 pt-2 animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="custom_category" className="text-xs font-bold text-[#1E6B34] flex items-center gap-1.5">
                  <span>Specify service not captured above</span> <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="custom_category"
                  name="custom_category"
                  type="text"
                  required
                  placeholder="e.g. Park bench repair, Drainage blockage, Noise complaint"
                  className="border-zinc-300 text-zinc-950 font-medium focus-visible:ring-[#1E6B34]"
                />
              </div>
            )}

            {state.fieldErrors?.category && (
              <p className="text-xs font-semibold text-rose-600">
                {state.fieldErrors.category}
              </p>
            )}
          </div>

          {/* 2. Specific Location & Administrative Division */}
          <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
            <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-200">
              <MapPin className="h-4 w-4 text-[#1E6B34]" />
              <span className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                Service Location & Administrative Area
              </span>
            </div>

            {/* Constituency & Ward Cascading Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Constituency */}
              <div className="space-y-2">
                <Label htmlFor="constituency" className="font-bold text-zinc-950">
                  Sub-County / Constituency <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="constituency"
                  name="constituency"
                  value={selectedConstituency}
                  onChange={handleConstituencyChange}
                  required
                  className="flex h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-950 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B34] focus-visible:ring-offset-1"
                >
                  <option value="" disabled>
                    Select Sub-County / Constituency...
                  </option>
                  {MURANGA_CONSTITUENCIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.constituency && (
                  <p className="text-xs font-semibold text-rose-600">
                    {state.fieldErrors.constituency}
                  </p>
                )}
              </div>

              {/* Ward */}
              <div className="space-y-2">
                <Label htmlFor="ward" className="font-bold text-zinc-950">
                  Ward <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="ward"
                  name="ward"
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  required
                  disabled={!selectedConstituency}
                  className="flex h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-950 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B34] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  <option value="" disabled>
                    {selectedConstituency ? 'Select Ward...' : 'Select a constituency first'}
                  </option>
                  {availableWards.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.ward && (
                  <p className="text-xs font-semibold text-rose-600">
                    {state.fieldErrors.ward}
                  </p>
                )}
              </div>
            </div>

            {/* Specific Landmark / Street */}
            <div className="space-y-2">
              <Label htmlFor="specific_location" className="font-bold text-zinc-950">
                Specific Landmark / Street / Village <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="specific_location"
                name="specific_location"
                type="text"
                placeholder="e.g. Near Kenol stage, next to public dispensary, along C70 road"
                required
                minLength={3}
                maxLength={200}
                className="border-zinc-300 bg-white text-zinc-950 font-medium"
              />
              {state.fieldErrors?.location && (
                <p className="text-xs font-semibold text-rose-600">
                  {state.fieldErrors.location}
                </p>
              )}
              <p className="text-xs text-zinc-600 font-medium">
                Provide precise landmark names, road junctions, or building references to guide field crews.
              </p>
            </div>
          </div>

          {/* 3. Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-bold text-zinc-950 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#1E6B34]" />
              <span>Detailed Description</span> <span className="text-rose-500">*</span>
            </Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe the nature of the fault, hazard, or repair needed..."
              required
              minLength={10}
              maxLength={2000}
              className="flex w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-950 font-medium ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B34] focus-visible:ring-offset-1"
            />
            {state.fieldErrors?.description && (
              <p className="text-xs font-semibold text-rose-600">
                {state.fieldErrors.description}
              </p>
            )}
          </div>

          {/* 4. Optional Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="image" className="font-bold text-zinc-950 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-[#1E6B34]" />
              <span>Attach Photo</span> <span className="text-xs text-zinc-600 font-medium">(Optional, max 2 MB)</span>
            </Label>

            <div className="rounded-lg border-2 border-dashed border-[#1E6B34]/30 bg-zinc-50/50 p-4 transition-colors hover:border-[#1E6B34]/60">
              {/* Critical for Form Submission: File input must remain in the DOM permanently so FormData contains the file */}
              <input
                ref={fileInputRef}
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />

              {!previewUrl ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-emerald-50 p-3 text-[#1E6B34] mb-2 border border-emerald-100">
                    <Upload className="h-5 w-5" />
                  </div>
                  <label
                    htmlFor="image"
                    className="cursor-pointer text-sm font-semibold text-[#1E6B34] hover:text-[#144d24] underline underline-offset-2"
                  >
                    Click to browse photo
                  </label>
                  <p className="text-xs text-zinc-600 font-medium mt-1">JPEG, PNG, or WebP up to 2 MB</p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[#1E6B34]/30 bg-zinc-100 shadow-sm">
                    <Image
                      src={previewUrl}
                      alt="Upload preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {fileName}
                    </p>
                    <p className="text-xs text-[#1E6B34] font-medium mt-0.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1E6B34]" />
                      Attached and ready to upload
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearImage}
                    className="text-zinc-500 hover:text-rose-600"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {(imageError || state.fieldErrors?.image) && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {imageError || state.fieldErrors?.image}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <Link href="/requests" className="w-full sm:w-auto">
            <Button variant="outline" type="button" className="w-full sm:w-auto gap-1.5" disabled={isPending}>
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto gap-2 px-6"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Service Request</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
