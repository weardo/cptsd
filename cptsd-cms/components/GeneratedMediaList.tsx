'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAsset, generatePostAssets, downloadAssetsAsZip, generatePostAssetsWithVariants, uploadExternalImages } from '@/app/actions/assets';
import JSZip from 'jszip';
import ImageModal from './ImageModal';
import { CompositionType } from '@cptsd/db';
import { TargetFormat } from '@/lib/imagePromptBuilder';

type GeneratedAsset = {
  id: string;
  kind: 'IMAGE_FEED' | 'IMAGE_STORY' | 'VIDEO_REEL_DRAFT' | 'IMAGE_CAROUSEL_SLIDE';
  size: string;
  url: string;
  thumbnailUrl?: string | null;
  slideNumber?: number | null;
  compositionType?: CompositionType | null;
  metadata?: {
    prompt?: string;
    model?: string;
    revised_prompt?: string;
    importance?: 'test' | 'normal' | 'hero';
    actionDescription?: string;
    extraStyleFlags?: string[];
    slideDescription?: string;
    generationParams?: {
      size?: string;
      quality?: string;
      style?: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
};

type GeneratedMediaListProps = {
  postId: string;
  assets: GeneratedAsset[];
  canGenerate: boolean; // Whether the post has script/caption ready for generation
  availableModels?: Array<{ value: string; label: string; cost: 'low' | 'medium' | 'high' }>;
  defaultModel?: string;
  defaultImportance?: 'test' | 'normal' | 'hero';
  onAssetsUpdated?: () => void; // Callback when assets are updated
};

export default function GeneratedMediaList({
  postId,
  assets: initialAssets,
  canGenerate,
  availableModels = [],
  defaultModel = 'dall-e-3',
  defaultImportance = 'normal',
  onAssetsUpdated,
}: GeneratedMediaListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generating, setGenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [assets, setAssets] = useState<GeneratedAsset[]>(initialAssets);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [uploadingExternal, setUploadingExternal] = useState(false);
  const [showUploadExternal, setShowUploadExternal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [selectedImportance, setSelectedImportance] = useState<'test' | 'normal' | 'hero'>(defaultImportance);
  const [useVariants, setUseVariants] = useState(false); // Toggle between old and new system
  const [selectedCompositions, setSelectedCompositions] = useState<CompositionType[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<TargetFormat[]>(['FEED_SQUARE']);
  const [selectedTone, setSelectedTone] = useState<'validating' | 'educational' | 'gentle' | 'hopeful' | 'grounding'>('gentle');
  const [actionDescription, setActionDescription] = useState('');
  const [extraStyleFlags, setExtraStyleFlags] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const abortControllerRef = useRef<AbortController | null>(null);
  const generationAbortedRef = useRef(false);

  // Warn user before leaving during generation
  useEffect(() => {
    if (generating && !cancelling) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Image generation is in progress. Are you sure you want to leave?';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [generating, cancelling]);

  const handleGenerateWithVariants = async () => {
    if (selectedCompositions.length === 0 || selectedFormats.length === 0) {
      setError('Please select at least one composition type and format');
      return;
    }

    // Validate action description for BIRD_ACTION_SCENE
    const hasActionScene = selectedCompositions.includes('BIRD_ACTION_SCENE');
    if (hasActionScene && !actionDescription.trim()) {
      setError('Please provide an action description for Bird Action Scene');
      return;
    }

    setGenerating(true);
    setCancelling(false);
    setError('');
    setSuccess('');
    setProgress({ current: 0, total: 0, message: 'Preparing generation...' });
    generationAbortedRef.current = false;

    abortControllerRef.current = new AbortController();

    try {
      // Build variants array from selected compositions and formats
      const variants: Array<{
        compositionType: CompositionType;
        targetFormat: TargetFormat;
        importance?: 'test' | 'normal' | 'hero';
        extraStyleFlags?: string[];
        actionDescription?: string;
      }> = [];

      selectedCompositions.forEach((composition) => {
        selectedFormats.forEach((format) => {
          variants.push({
            compositionType: composition,
            targetFormat: format,
            importance: selectedImportance,
            extraStyleFlags: extraStyleFlags.length > 0 ? extraStyleFlags : undefined,
            actionDescription:
              composition === 'BIRD_ACTION_SCENE' ? actionDescription : undefined,
          });
        });
      });

      const estimatedTotal = variants.length;
      setProgress({ current: 0, total: estimatedTotal, message: `Generating ${estimatedTotal} image(s)...` });

      const result = await generatePostAssetsWithVariants(postId, variants, selectedTone);

      if (generationAbortedRef.current) {
        setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
        setError('Generation was cancelled');
        return;
      }

      if (result.success && result.assets) {
        setProgress({ current: result.assets.length, total: result.assets.length, message: 'Complete!' });
        setAssets((prev) => [...result.assets!, ...prev]);
        setSuccess(`Generated ${result.assets.length} asset(s) successfully!`);
        setTimeout(() => {
          setProgress({ current: 0, total: 0, message: '' });
        }, 2000);
        router.refresh();
        onAssetsUpdated?.();
      } else {
        setProgress({ current: 0, total: 0, message: '' });
        setError(result.error || 'Failed to generate assets');
      }
    } catch (err) {
      if (generationAbortedRef.current) {
        setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
        setError('Generation was cancelled');
      } else {
        setProgress({ current: 0, total: 0, message: '' });
        setError(err instanceof Error ? err.message : 'Failed to generate assets');
      }
    } finally {
      setGenerating(false);
      setCancelling(false);
      abortControllerRef.current = null;
    }
  };

  const handleGenerateAssets = async (variants: Array<'FEED' | 'STORY' | 'REEL'> = ['FEED', 'STORY']) => {
    setGenerating(true);
    setCancelling(false);
    setError('');
    setSuccess('');
    setProgress({ current: 0, total: 0, message: 'Preparing generation...' });
    generationAbortedRef.current = false;

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Estimate total images to generate
      // For carousel, we'll estimate based on script length
      // For regular posts: FEED (1) + STORY (1) + REEL (1 if included) = 2-3 images
      const estimatedTotal = variants.length;
      setProgress({ current: 0, total: estimatedTotal, message: `Generating ${estimatedTotal} image(s)...` });

      // Note: Server actions can't be aborted directly, but we can track cancellation state
      const result = await generatePostAssets(postId, variants, selectedModel, selectedImportance);

      if (generationAbortedRef.current) {
        setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
        setError('Generation was cancelled');
        return;
      }

      if (result.success && result.assets) {
        setProgress({ current: result.assets.length, total: result.assets.length, message: 'Complete!' });
        setAssets((prev) => [...result.assets!, ...prev]);
        setSuccess(`Generated ${result.assets.length} asset(s) successfully!`);
        setTimeout(() => {
          setProgress({ current: 0, total: 0, message: '' });
        }, 2000);
        router.refresh();
        onAssetsUpdated?.();
      } else {
        setProgress({ current: 0, total: 0, message: '' });
        setError(result.error || 'Failed to generate assets');
      }
    } catch (err) {
      if (generationAbortedRef.current) {
        setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
        setError('Generation was cancelled');
      } else {
        setProgress({ current: 0, total: 0, message: '' });
        setError(err instanceof Error ? err.message : 'Failed to generate assets');
      }
    } finally {
      setGenerating(false);
      setCancelling(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (!generating) return;
    
    setCancelling(true);
    generationAbortedRef.current = true;
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Note: Server actions will continue running, but we stop waiting for them
    setProgress({ current: 0, total: 0, message: 'Cancelling...' });
    
    setTimeout(() => {
      setGenerating(false);
      setCancelling(false);
      setProgress({ current: 0, total: 0, message: 'Cancelled' });
    }, 1000);
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      const result = await deleteAsset(assetId);

      if (result.success) {
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
        setSuccess('Asset deleted successfully');
        router.refresh();
        onAssetsUpdated?.();
      } else {
        setError(result.error || 'Failed to delete asset');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    setError('');
    setSuccess('');

    try {
      const result = await downloadAssetsAsZip(postId);

      if (!result.success || !result.assets) {
        setError(result.error || 'Failed to prepare ZIP download');
        return;
      }

      // Create ZIP file using JSZip
      const zip = new JSZip();
      
      // Download each asset and add to ZIP
      for (const asset of result.assets) {
        try {
          const response = await fetch(asset.url);
          if (!response.ok) {
            console.warn(`Failed to fetch ${asset.url}`);
            continue;
          }
          const blob = await response.blob();
          zip.file(asset.filename, blob);
        } catch (err) {
          console.error(`Error downloading ${asset.url}:`, err);
        }
      }

      // Generate ZIP file and trigger download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `post-${postId}-assets.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('ZIP file downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ZIP file');
    } finally {
      setDownloadingZip(false);
    }
  };

  const getKindLabel = (kind: string, slideNumber?: number | null) => {
    switch (kind) {
      case 'IMAGE_FEED':
        return 'Feed';
      case 'IMAGE_STORY':
        return 'Story';
      case 'VIDEO_REEL_DRAFT':
        return 'Reel (Draft)';
      case 'IMAGE_CAROUSEL_SLIDE':
        return slideNumber ? `Slide ${slideNumber}` : 'Carousel Slide';
      default:
        return kind;
    }
  };

  const getCompositionLabel = (compositionType?: CompositionType | null) => {
    if (!compositionType) return '';
    switch (compositionType) {
      case 'BACKGROUND_ONLY':
        return 'Background Only';
      case 'BIRD_ONLY':
        return 'Bird Only';
      case 'BIRD_WITH_SPEECH_BUBBLE':
        return 'Bird + Speech Bubble';
      case 'BIRD_ACTION_SCENE':
        return 'Bird Action Scene';
      case 'TEXT_FOCUSED':
        return 'Text Focused';
      default:
        return compositionType;
    }
  };

  const getKindBadgeColor = (kind: string) => {
    switch (kind) {
      case 'IMAGE_FEED':
        return 'bg-blue-100 text-blue-800';
      case 'IMAGE_STORY':
        return 'bg-purple-100 text-purple-800';
      case 'VIDEO_REEL_DRAFT':
        return 'bg-green-100 text-green-800';
      case 'IMAGE_CAROUSEL_SLIDE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImportanceBadgeColor = (importance?: string) => {
    switch (importance) {
      case 'hero':
        return 'bg-yellow-100 text-yellow-800';
      case 'test':
        return 'bg-gray-100 text-gray-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModelBadgeColor = (model?: string) => {
    if (model?.includes('dall-e-3')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (model?.includes('dall-e-2')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const handleUploadExternalImages = async (files: FileList | null, zipFile: File | null) => {
    if ((!files || files.length === 0) && !zipFile) {
      setError('Please select image files or a ZIP file');
      return;
    }

    setUploadingExternal(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }
      
      if (zipFile) {
        formData.append('zipFile', zipFile);
      }

      const result = await uploadExternalImages(postId, formData);

      if (result.success && result.assets) {
        setAssets((prev) => [...result.assets!, ...prev]);
        setSuccess(result.message || `Uploaded ${result.assets.length} image(s) successfully!`);
        setTimeout(() => setSuccess(''), 3000);
        setShowUploadExternal(false);
        router.refresh();
        onAssetsUpdated?.();
      } else {
        setError(result.error || 'Failed to upload images');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploadingExternal(false);
    }
  };

  return (
    <>
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Generated Media</h2>
          <div className="flex items-center gap-2">
            {!generating && !uploadingExternal && (
              <button
                type="button"
                onClick={() => setShowUploadExternal(!showUploadExternal)}
                className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                title="Upload externally generated images (from ChatGPT, etc.)"
              >
                📤 Upload External Images
              </button>
            )}
            {canGenerate && !generating && (
              <div className="flex items-center space-x-2">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={useVariants}
                    onChange={(e) => setUseVariants(e.target.checked)}
                    className="mr-2"
                  />
                  Use Controlled Variations
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Upload External Images Section */}
        {showUploadExternal && !generating && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Upload Externally Generated Images</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload images generated externally (e.g., from ChatGPT). You can upload multiple images or a ZIP file containing images.
            </p>
            
            <div className="space-y-4">
              {/* Multiple Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload Multiple Images</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUploadExternalImages(e.target.files, null);
                    }
                  }}
                  className="input text-sm"
                  disabled={uploadingExternal}
                />
                <p className="text-xs text-gray-500 mt-1">Select multiple image files (JPEG, PNG, GIF, WebP)</p>
              </div>

              {/* ZIP File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Or Upload ZIP File</label>
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadExternalImages(null, e.target.files[0]);
                    }
                  }}
                  className="input text-sm"
                  disabled={uploadingExternal}
                />
                <p className="text-xs text-gray-500 mt-1">Upload a ZIP file containing images</p>
              </div>

              {uploadingExternal && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  Uploading images... Please wait.
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowUploadExternal(false)}
                className="btn btn-secondary text-sm"
                disabled={uploadingExternal}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Variant-based generation form */}
        {canGenerate && useVariants && !generating && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Generate with Controlled Variations</h3>
            
            <div className="space-y-4">
              {/* Composition Types */}
              <div>
                <label className="block text-sm font-medium mb-2">Composition Types</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(['BACKGROUND_ONLY', 'BIRD_ONLY', 'BIRD_WITH_SPEECH_BUBBLE', 'BIRD_ACTION_SCENE', 'TEXT_FOCUSED'] as CompositionType[]).map((comp) => (
                    <label key={comp} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCompositions.includes(comp)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCompositions([...selectedCompositions, comp]);
                          } else {
                            setSelectedCompositions(selectedCompositions.filter((c) => c !== comp));
                          }
                        }}
                        className="mr-2"
                      />
                      {getCompositionLabel(comp)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Formats */}
              <div>
                <label className="block text-sm font-medium mb-2">Target Formats</label>
                <div className="flex gap-4">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes('FEED_SQUARE')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFormats([...selectedFormats, 'FEED_SQUARE']);
                        } else {
                          setSelectedFormats(selectedFormats.filter((f) => f !== 'FEED_SQUARE'));
                        }
                      }}
                      className="mr-2"
                    />
                    Feed Square (1080×1080)
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes('STORY_VERTICAL')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFormats([...selectedFormats, 'STORY_VERTICAL']);
                        } else {
                          setSelectedFormats(selectedFormats.filter((f) => f !== 'STORY_VERTICAL'));
                        }
                      }}
                      className="mr-2"
                    />
                    Story Vertical (1080×1920)
                  </label>
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as any)}
                  className="input text-sm w-full max-w-xs"
                >
                  <option value="gentle">Gentle</option>
                  <option value="validating">Validating</option>
                  <option value="educational">Educational</option>
                  <option value="hopeful">Hopeful</option>
                  <option value="grounding">Grounding</option>
                </select>
              </div>

              {/* Action Description (for BIRD_ACTION_SCENE) */}
              {selectedCompositions.includes('BIRD_ACTION_SCENE') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Action Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    placeholder="e.g., doing a simple grounding exercise, sitting quietly with a hand on heart..."
                    className="input text-sm"
                    rows={2}
                  />
                </div>
              )}

              {/* Importance */}
              <div>
                <label className="block text-sm font-medium mb-2">Importance</label>
                <select
                  value={selectedImportance}
                  onChange={(e) => setSelectedImportance(e.target.value as 'test' | 'normal' | 'hero')}
                  className="input text-sm w-full max-w-xs"
                  title="Importance level affects model selection (hero = DALL-E 3, normal/test = DALL-E 2)"
                >
                  <option value="test">Test (D2)</option>
                  <option value="normal">Normal (D2)</option>
                  <option value="hero">Hero (D3)</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateWithVariants}
                disabled={generating || selectedCompositions.length === 0 || selectedFormats.length === 0}
                className="btn btn-primary text-sm"
              >
                Generate Selected Variants
              </button>
            </div>
          </div>
        )}

        {/* Legacy generation controls */}
        {canGenerate && !useVariants && !generating && (
          <div className="mb-4 flex items-center space-x-3 flex-wrap gap-2">
              {availableModels.length > 0 && (
              <>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="input text-sm"
                  disabled={generating}
                >
                  <option value="dall-e-3">DALL-E 3 (Recommended)</option>
                  <option value="dall-e-2">DALL-E 2 (Faster, cheaper)</option>
                </select>
                <select
                  value={selectedImportance}
                  onChange={(e) => setSelectedImportance(e.target.value as 'test' | 'normal' | 'hero')}
                  className="input text-sm"
                  disabled={generating}
                  title="Importance level affects model selection (hero = DALL-E 3, normal/test = DALL-E 2)"
                >
                  <option value="test">Test (D2)</option>
                  <option value="normal">Normal (D2)</option>
                  <option value="hero">Hero (D3)</option>
                </select>
              </>
              )}
              <button
                type="button"
                onClick={() => handleGenerateAssets(['FEED', 'STORY'])}
                disabled={generating}
                className="btn btn-primary text-sm"
              >
                Generate Visuals
              </button>
            </div>
          )}
          {generating && (
            <button
              type="button"
              onClick={handleCancelGeneration}
              disabled={cancelling}
              className="btn btn-secondary text-sm"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Generation'}
            </button>
          )}

        {/* Progress Indicator */}
        {generating && progress.total > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900">{progress.message}</span>
              <span className="text-sm text-blue-700">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((progress.current / progress.total) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Generating images... This may take a while. Do not close this tab.
            </p>
          </div>
        )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          {success}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No generated assets yet</p>
          {canGenerate ? (
            <p className="text-sm">Click "Generate Visuals" to create images for this post</p>
          ) : (
            <p className="text-sm">Generate script and caption first, then create visuals</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div
                  className="relative bg-gray-100 aspect-square cursor-pointer group overflow-hidden"
                  onClick={() => setSelectedImage({ url: asset.url, alt: `${asset.kind} - ${asset.size}` })}
                >
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={`${asset.kind} - ${asset.size}`}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      // Check if this is an OpenAI URL (expired)
                      const isOpenAIUrl = img.src.includes('oaidalleapiprodscus.blob.core.windows.net') || 
                                         img.src.includes('openai.com');
                      
                      // Fallback to placeholder
                      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzkzOGE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkV4cGlyZWQ8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOWM5YTk3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
                      
                      // Add error indicator
                      const container = img.parentElement;
                      if (container && isOpenAIUrl) {
                        container.setAttribute('data-expired', 'true');
                        // Add a badge indicating the image expired
                        const badge = document.createElement('div');
                        badge.className = 'absolute top-2 left-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded z-10';
                        badge.textContent = 'Expired';
                        container.appendChild(badge);
                      }
                    }}
                  />
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getKindBadgeColor(
                        asset.kind
                      )}`}
                    >
                      {getKindLabel(asset.kind, asset.slideNumber)}
                    </span>
                  </div>
                  {/* Overlay hint - subtle without darkening */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 px-3 py-1.5 rounded-lg shadow-lg">
                      Click to preview
                    </span>
                  </div>
                </div>

                {/* Asset Info */}
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getKindLabel(asset.kind, asset.slideNumber)}
                      </p>
                      <p className="text-xs text-gray-500">{asset.size}</p>
                      {asset.metadata?.slideDescription && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {asset.metadata.slideDescription}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="text-red-600 hover:text-red-800 text-sm ml-2"
                      title="Delete asset"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                    {asset.compositionType && (
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800"
                        title={`Composition: ${getCompositionLabel(asset.compositionType)}`}
                      >
                        {getCompositionLabel(asset.compositionType)}
                      </span>
                    )}
                    {asset.metadata?.model && (
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${getModelBadgeColor(
                          asset.metadata.model
                        )}`}
                        title={`Model: ${asset.metadata.model}`}
                      >
                        {asset.metadata.model.includes('dall-e-3') ? 'D3' : 'D2'}
                      </span>
                    )}
                    {asset.metadata?.importance && (
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${getImportanceBadgeColor(
                          asset.metadata.importance
                        )}`}
                        title={`Importance: ${asset.metadata.importance}`}
                      >
                        {asset.metadata.importance}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs text-gray-600 bg-gray-50 rounded" title={`Created: ${formatDate(asset.createdAt)}`}>
                      {new Date(asset.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ url: asset.url, alt: `${asset.kind} - ${asset.size}` })}
                      className="flex-1 text-center px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          // Fetch image as blob
                          const response = await fetch(asset.url);
                          const blob = await response.blob();
                          
                          // Copy to clipboard
                          await navigator.clipboard.write([
                            new ClipboardItem({
                              [blob.type]: blob,
                            }),
                          ]);
                          
                          setSuccess(`Image copied to clipboard!`);
                          setTimeout(() => setSuccess(''), 3000);
                        } catch (err) {
                          // Fallback: try to copy image URL
                          try {
                            await navigator.clipboard.writeText(asset.url);
                            setSuccess('Image URL copied to clipboard!');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (urlErr) {
                            setError('Failed to copy image. Try downloading instead.');
                          }
                        }
                      }}
                      className="flex-1 text-center px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                      title="Copy image to clipboard"
                    >
                      📋 Copy
                    </button>
                    <a
                      href={asset.url}
                      download
                      className="flex-1 text-center px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          {assets.length > 0 && (
            <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2">
              {assets.length > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isPending || generating}
                  className="btn btn-secondary text-sm"
                >
                  {downloadingZip ? 'Creating ZIP...' : 'Download All as ZIP'}
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  try {
                    setSuccess('Copying images to clipboard (one at a time)...');
                    
                    // Copy images one at a time (browser limitation - can only copy one at a time)
                    let successCount = 0;
                    let failCount = 0;
                    
                    for (let i = 0; i < assets.length; i++) {
                      const asset = assets[i];
                      try {
                        const response = await fetch(asset.url);
                        if (!response.ok) {
                          failCount++;
                          continue;
                        }
                        
                        const blob = await response.blob();
                        await navigator.clipboard.write([
                          new ClipboardItem({
                            [blob.type]: blob,
                          }),
                        ]);
                        
                        successCount++;
                        
                        // Small delay between copies to avoid overwhelming the clipboard API
                        if (i < assets.length - 1) {
                          await new Promise(resolve => setTimeout(resolve, 300));
                        }
                      } catch (err) {
                        console.warn(`Failed to copy ${asset.id}:`, err);
                        failCount++;
                      }
                    }
                    
                    if (successCount > 0) {
                      setSuccess(`Copied ${successCount} image(s) to clipboard! ${failCount > 0 ? `(${failCount} failed)` : ''}`);
                      setTimeout(() => setSuccess(''), 5000);
                    } else {
                      setError('Failed to copy images. Try copying individually or downloading instead.');
                    }
                  } catch (err) {
                    console.error('Error copying images:', err);
                    setError('Failed to copy images to clipboard. Note: Browsers can only copy one image at a time. Try copying individually.');
                  }
                }}
                disabled={isPending || generating}
                className="btn btn-secondary text-sm"
                title="Copy all images to clipboard (one at a time) for pasting into ChatGPT"
              >
                📋 Copy All Images
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}

