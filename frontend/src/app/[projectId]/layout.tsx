import { PageContainer } from '@/components/layout/PageContainer'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PageContainer>{children}</PageContainer>
}
