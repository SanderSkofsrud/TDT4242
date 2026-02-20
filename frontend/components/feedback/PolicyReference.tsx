interface PolicyReferenceProps {
  version: number
  filePath: string
}

export function PolicyReference({ version, filePath }: PolicyReferenceProps) {
  const href = filePath.startsWith('http') ? filePath : `${import.meta.env.VITE_API_URL ?? ''}${filePath}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-600 font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
    >
      View Policy Document (Version {version})
    </a>
  )
}
