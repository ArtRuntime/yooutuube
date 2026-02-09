import UrlForm from '@/components/UrlForm';
import { Share2, Zap, Globe } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-24">
      {/* Background Gradients */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-12">
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-3xl text-center mb-12">
        <h1 className="text-5xl sm:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-6 pb-2">
          Shorten. Share. Track.
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mb-8">
          Create rich-preview links that stand out. Track clicks, location, and device data with precision.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl mb-12 text-left">
          <FeatureCard
            icon={<Share2 className="w-6 h-6 text-blue-400" />}
            title="Rich Previews"
            desc="Preserves OG tags for beautiful embeds on Discord & WhatsApp."
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6 text-purple-400" />}
            title="Geo Tracking"
            desc="Capture city, country, and even precise GPS coordinates."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-pink-400" />}
            title="Lightning Fast"
            desc="Instant redirection optimized for edge performance."
          />
        </div>

        <UrlForm />
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass p-6 rounded-2xl hover:bg-white/10 transition-all duration-300">
      <div className="mb-4 p-3 bg-white/5 rounded-xl w-fit">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  )
}
