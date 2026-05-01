export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-violet-50 to-indigo-50" />
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-unichain-pink/30 blur-3xl animate-blob-slow" />
      <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-unichain-purple/30 blur-3xl animate-blob-slower" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl animate-blob-slow" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%237d52ff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
