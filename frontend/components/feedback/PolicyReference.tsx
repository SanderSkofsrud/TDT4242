interface PolicyReferenceProps {
  version: number
  filePath: string
}

export function PolicyReference({ version, filePath }: PolicyReferenceProps) {
  const href = filePath.startsWith('http') ? filePath : `${import.meta.env.VITE_API_URL ?? ''}${filePath}`
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      View Policy Document (Version {version})
    </a>
  )
}
