import { useEffect } from 'react'
import { useProject } from '@/contexts/project-context'
import { usePathname } from 'next/navigation'

/**
 * Hook to automatically update the document title with the project name
 *
 * @param pageTitle - The title of the current page (e.g., "Budget", "Commitments")
 * @param includeProject - Whether to include project name in title (default: true)
 */
export function useProjectTitle(pageTitle?: string, includeProject = true) {
  const { selectedProject } = useProject()
  const pathname = usePathname()

  useEffect(() => {
    // Build the title parts
    const parts: string[] = []

    // Add project name if available and requested
    if (includeProject && selectedProject?.name) {
      parts.push(selectedProject.name)
    }

    // Add page title if provided
    if (pageTitle) {
      parts.push(pageTitle)
    } else {
      // Try to infer page title from pathname
      const segments = pathname.split('/').filter(Boolean)
      const lastSegment = segments[segments.length - 1]

      if (lastSegment && !/^\d+$/.test(lastSegment)) {
        // Capitalize and format the segment
        const formattedTitle = lastSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        parts.push(formattedTitle)
      }
    }

    // Add app name
    parts.push('Alleato OS')

    // Set the document title
    document.title = parts.join(' - ')

    // Cleanup function to restore default title on unmount
    return () => {
      document.title = 'Alleato OS - Procore Alternative'
    }
  }, [selectedProject, pageTitle, pathname, includeProject])
}
