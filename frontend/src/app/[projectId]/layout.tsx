export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-full overflow-x-hidden">
      {children}
    </div>
  )
}
