import { useState } from 'react'
import { XMarkIcon, SparklesIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { fileToBase64 } from '#/utils/file'

type ImagePickerProps = {
  imageUrl: string | undefined
  onImageChange: (url: string | undefined) => void
  onUpload: (base64: string, mimeType: string) => Promise<string>
  onGenerate: () => Promise<string>
  canGenerate?: boolean
  /** Visual variant: 'compact' renders inline buttons, 'banner' renders a full-width placeholder */
  variant?: 'compact' | 'banner'
}

const ImagePicker = ({
  imageUrl,
  onImageChange,
  onUpload,
  onGenerate,
  canGenerate = true,
  variant = 'compact',
}: ImagePickerProps) => {
  const [generatingImage, setGeneratingImage] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleGenerate = async () => {
    setGeneratingImage(true)
    try {
      const url = await onGenerate()
      onImageChange(url)
    } catch (err) {
      console.error('Image generation failed:', err)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const base64 = await fileToBase64(file)
      const url = await onUpload(base64, file.type)
      onImageChange(url)
    } catch (err) {
      console.error('Image upload failed:', err)
    } finally {
      setUploadingImage(false)
    }
  }

  const uploadButton = (
    <label className={`flex cursor-pointer items-center gap-${variant === 'banner' ? '2' : '1.5'} rounded-lg ${
      variant === 'banner'
        ? 'bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100'
        : 'bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200'
    }`}>
      <PhotoIcon className="h-4 w-4" />
      {uploadingImage ? 'Laddar upp...' : 'Ladda upp bild'}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploadingImage}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />
    </label>
  )

  const generateButton = (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={generatingImage || !canGenerate}
      className={`flex items-center gap-${variant === 'banner' ? '2' : '1.5'} rounded-lg ${
        variant === 'banner'
          ? 'bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50'
          : 'bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200 disabled:opacity-50'
      }`}
    >
      <SparklesIcon className="h-4 w-4" />
      {generatingImage ? 'Genererar...' : 'Generera med AI'}
    </button>
  )

  if (imageUrl) {
    if (variant === 'banner') {
      return (
        <img
          src={imageUrl}
          alt="Receptbild"
          className="max-h-96 w-full object-cover"
        />
      )
    }

    return (
      <div className="relative overflow-hidden rounded-lg">
        <img src={imageUrl} alt="Receptbild" className="max-h-48 w-full object-cover" />
        <button
          type="button"
          onClick={() => onImageChange(undefined)}
          className="absolute right-2 top-2 rounded-lg bg-white/90 p-1 text-gray-500 shadow-sm hover:bg-white"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="flex items-center justify-center gap-3 border-b border-dashed border-gray-200 bg-gray-50 py-10">
        {uploadButton}
        {generateButton}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {uploadButton}
      {generateButton}
    </div>
  )
}

export { ImagePicker }
