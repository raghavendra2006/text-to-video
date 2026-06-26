import { Link } from 'react-router-dom';
import { Video, Shield, Volume2, Globe, ArrowRight, PlaySquare } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Brand Hero */}
      <div className="mb-6 flex items-center gap-3">
        <PlaySquare className="text-saffron w-14 h-14" />
        <h2 className="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-saffron via-white to-tricolorGreen bg-clip-text text-transparent">
          PIB Text-To-Video Generator
        </h2>
      </div>
      
      <p className="max-w-2xl text-lg text-gray-300 mb-10">
        Transform official Government of India press releases into localized broadcast-ready infographic videos. Translate, narrate, and generate automated video storyboards in 14 regional scripts instantly.
      </p>

      {/* Auth Triggers */}
      <div className="flex gap-4 mb-16">
        <Link 
          to="/login" 
          className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <span>Portal Login</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link 
          to="/register" 
          className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold transition-all"
        >
          Request Access
        </Link>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mb-20 text-left">
        <div className="glass-card p-6 rounded-2xl">
          <Globe className="text-saffron w-8 h-8 mb-4" />
          <h4 className="font-bold text-lg mb-2">Multilingual</h4>
          <p className="text-sm text-gray-400">Support for English and 13 major Indian regional languages with semantic mapping.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <Volume2 className="text-purple-400 w-8 h-8 mb-4" />
          <h4 className="font-bold text-lg mb-2">Neural Speech</h4>
          <p className="text-sm text-gray-400">Synthesize natural regional voice narration matched with subtitle alignments.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <Video className="text-tricolorGreen w-8 h-8 mb-4" />
          <h4 className="font-bold text-lg mb-2">Pillow Visuals</h4>
          <p className="text-sm text-gray-400">Render custom high-definition infographic frames featuring modern glassmorphism decks.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <Shield className="text-blue-400 w-8 h-8 mb-4" />
          <h4 className="font-bold text-lg mb-2">Audited Security</h4>
          <p className="text-sm text-gray-400">Role-based access credentials (Admin, Editor, Reviewer) and audit trail tracking.</p>
        </div>
      </div>

      {/* Interactive Flowchart */}
      <h3 className="text-2xl font-bold mb-8">End-to-End Processing Workflow</h3>
      <div className="glass-card p-8 rounded-3xl w-full flex flex-col md:flex-row items-center justify-around gap-4 text-center">
        <div className="flex-1">
          <div className="w-12 h-12 rounded-full bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron font-bold mx-auto mb-2">1</div>
          <h5 className="font-bold mb-1">PIB RSS Ingestion</h5>
          <p className="text-xs text-gray-400">Fetch latest releases or upload docs</p>
        </div>
        <div className="text-gray-600 hidden md:block">➔</div>
        <div className="flex-1">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold mx-auto mb-2">2</div>
          <h5 className="font-bold mb-1">Translate & Script</h5>
          <p className="text-xs text-gray-400">Break text into scene storyboards</p>
        </div>
        <div className="text-gray-600 hidden md:block">➔</div>
        <div className="flex-1">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold mx-auto mb-2">3</div>
          <h5 className="font-bold mb-1">TTS & Layouts</h5>
          <p className="text-xs text-gray-400">Generate voice and Pillow frames</p>
        </div>
        <div className="text-gray-600 hidden md:block">➔</div>
        <div className="flex-1">
          <div className="w-12 h-12 rounded-full bg-tricolorGreen/20 border border-tricolorGreen/40 flex items-center justify-center text-tricolorGreen font-bold mx-auto mb-2">4</div>
          <h5 className="font-bold mb-1">FFmpeg Compile</h5>
          <p className="text-xs text-gray-400">Stitch audio and visual scenes</p>
        </div>
      </div>
    </div>
  );
}
