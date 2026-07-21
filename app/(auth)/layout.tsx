export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:px-6 lg:px-8 bg-muted/40">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-foreground select-none">
            Recurr
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}

