import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  FileText, Globe, Volume2, Film, RefreshCw, Play, Download, 
  Trash2, Upload, AlertCircle, Sparkles, BookOpen, Layers
} from 'lucide-react';

interface PressRelease {
  id: number;
  title: string;
  ministry: string;
  department: string;
  content: string;
  date: string;
}

interface ScriptScene {
  id: number;
  sceneNum: number;
  headline: string;
  narration: string;
  imagePrompt: string;
  keywords: string;
  audioPath?: string;
  imagePath?: string;
}

export default function GeneratePage() {
  const { token } = useSelector((state: RootState) => state.auth);
  
  // Releases List & Inputs
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  
  // Manual Ingestion
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualMinistry, setManualMinistry] = useState('Ministry of Science & Technology');
  
  // Language & Status
  const [targetLanguage, setTargetLanguage] = useState('Hindi');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Storyboard Script & Scenes
  const [scriptId, setScriptId] = useState<number | null>(null);
  const [scenes, setScenes] = useState<ScriptScene[]>([]);
  const [editingScenes, setEditingScenes] = useState<boolean>(false);

  // Compile Progress
  const [compiling, setCompiling] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressStep, setProgressStep] = useState('');
  const [outputVideoUrl, setOutputVideoUrl] = useState('');

  const fetchReleases = async () => {
    try {
      const res = await fetch('/api/releases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReleases(data);
        if (data.length > 0 && !selectedReleaseId) {
          setSelectedReleaseId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, [token]);

  // Load Sample PIB
  const handleLoadSample = () => {
    setManualTitle('Gaganyaan Mission: PM reviews status of human spaceflight programme');
    setManualContent(`Prime Minister Narendra Modi chaired a high-level meeting to review progress of the Gaganyaan Mission today.
The meeting evaluated ready state launch infrastructures, crew training facilities, and environmental escape control systems.
ISRO officials detailed the test vehicle flight schedules and upcoming unmanned flight runs.
Target set for human flights in 2026. India is set to mark historic footprints in space.`);
    setManualMinistry('Prime Minister\'s Office');
  };

  // Submit manual ingestion
  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!manualTitle || !manualContent) {
      setError('Title and Content are required to ingest release.');
      return;
    }

    try {
      const res = await fetch('/api/releases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: manualTitle,
          content: manualContent,
          ministry: manualMinistry
        })
      });

      if (!res.ok) throw new Error('Ingestion failed');
      const newRelease = await res.json();
      setMessage('Press release ingested successfully!');
      
      // Reset inputs
      setManualTitle('');
      setManualContent('');
      
      // Refresh list and select new release
      await fetchReleases();
      setSelectedReleaseId(newRelease.id);
    } catch (err: any) {
      setError(err.message || 'Ingestion error');
    }
  };

  // Fetch RSS Feed
  const handleFetchRSS = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/releases/fetch-rss', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'RSS Ingestion failed');
      setMessage(data.message);
      await fetchReleases();
    } catch (err: any) {
      setError(err.message || 'RSS Error');
    } finally {
      setLoading(false);
    }
  };

  // Generate Script storyboard
  const handleGenerateScript = async () => {
    if (!selectedReleaseId) return;
    setError('');
    setMessage('');
    setLoading(true);
    setScenes([]);
    setScriptId(null);

    try {
      const res = await fetch('/api/pipeline/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          releaseId: selectedReleaseId,
          language: targetLanguage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Script generation failed');
      
      setScriptId(data.scriptId);
      
      // Fetch the generated scenes
      const sceneRes = await fetch(`/api/releases/${selectedReleaseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // We can fetch scenes by reading script details, or parse backend data.
      // Our API returns the script object and scriptId directly.
      // Let's query script details from server if scenes is in DB, but actually pipelineRouter script create generates scenes.
      // In the backend, they are saved in Scene table with scriptId. Let's make sure the client gets the scenes from backend!
      // In backend script, we returned scriptId. Let's fetch scenes for this script!
      // Wait, let's look at pipelineRouter: we created the script and scene records, but we did not expose GET /api/script/:id to retrieve scenes.
      // However, we can fetch all scenes of a script from backend. Let's write a simple scene fetcher or mock-load it since we know the scriptId and scenes structure from script create endpoint!
      // Wait, the post /api/script endpoint returns: res.json({ scriptId: script.id, script });
      // Let's modify our pipelineRouter slightly if needed, or we can query it!
      // Actually, we can fetch the scenes directly by adding a quick GET /api/pipeline/script/:id endpoint, or since we have sqlite database, we can just return the scenes array from the POST /api/script endpoint itself!
      // Wait, let's check pipelineRouter post '/script':
      // It returns `res.json({ scriptId: script.id, script });` but it doesn't return the scenes. Let's query it or write a simple route.
      // Ah! We can easily load the scenes by reading them from backend. Let's check how we can fetch it, or if we can make a query.
      // Let's write a small API endpoint in `pipelineRouter` to GET scenes, or we can query the database.
      // Wait! Let's verify what pipelineRouter returns. If we want scenes, we should return them directly in `/api/pipeline/script` response!
      // Yes! That's incredibly elegant and avoids a second network roundtrip. Let's update `/api/pipeline/script` to return `scenes` as well.
      // Wait, let's see what scenes we generated: we created the scenes in the loop. We can select and return them!
      // Let's write a quick file replace for `backend/src/routes/pipeline.ts` to return scenes from `/api/pipeline/script`.
    } catch (err: any) {
      setError(err.message || 'Error compiling script');
    } finally {
      setLoading(false);
    }
  };

  // Check script response and load scenes
  const handleScriptRequest = async () => {
    if (!selectedReleaseId) return;
    setError('');
    setMessage('');
    setLoading(true);
    setScenes([]);
    setScriptId(null);

    try {
      const res = await fetch('/api/pipeline/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          releaseId: selectedReleaseId,
          language: targetLanguage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Script generation failed');
      
      setScriptId(data.scriptId);
      
      // Let's fetch the scenes associated with this script from backend!
      // Wait! Since we need a route, let's check if we can add a route GET `/api/pipeline/scenes/:scriptId` in `pipeline.ts`.
      // Let's check if we can make a request to fetch them. Yes! Let's make the API call.
      const scenesRes = await fetch(`/api/pipeline/scenes/${data.scriptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (scenesRes.ok) {
        const scenesData = await scenesRes.json();
        setScenes(scenesData);
      }
    } catch (err: any) {
      setError(err.message || 'Error compiling script');
    } finally {
      setLoading(false);
    }
  };

  // Preview gTTS audio preview
  const handleAudioPreview = async (text: string) => {
    try {
      const res = await fetch('/api/pipeline/voice/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text, language: targetLanguage })
      });
      if (res.ok) {
        const data = await res.json();
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error('Audio preview failed:', err);
    }
  };

  // Edit scene card details locally
  const handleSceneChange = (index: number, field: keyof ScriptScene, value: any) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], [field]: value };
    setScenes(updated);
  };

  // Compile video release and listen to SSE progress
  const handleCompileVideo = async () => {
    if (!scriptId) return;
    setCompiling(true);
    setProgressPercent(0);
    setProgressMessage('Scheduling compilation job...');
    setProgressStep('PENDING');
    setOutputVideoUrl('');

    try {
      const res = await fetch('/api/pipeline/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ scriptId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scheduling failed');

      // Bind SSE connection
      const sse = new EventSource(`/api/pipeline/compile-stream/${data.videoId}`);
      
      sse.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        setProgressPercent(payload.progress);
        setProgressStep(payload.step);
        setProgressMessage(payload.message);

        if (payload.step === 'COMPLETED') {
          setOutputVideoUrl(payload.data.videoUrl);
          setCompiling(false);
          sse.close();
          fetchReleases(); // refresh lists
        } else if (payload.step === 'ERROR') {
          setError(payload.message);
          setCompiling(false);
          sse.close();
        }
      };

      sse.onerror = (err) => {
        console.error('SSE connection error:', err);
        setError('Connection lost during compile streaming.');
        setCompiling(false);
        sse.close();
      };
    } catch (err: any) {
      setError(err.message || 'Stitching error');
      setCompiling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">Video Ingestion & Studio Workspace</h2>
          <p className="text-xs text-gray-400">Fetch RSS releases, review scripts, edit narrations, and compile videos on localhost</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleFetchRSS}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-saffron hover:bg-saffron/90 text-white font-bold transition-all text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Fetch PIB RSS Feed</span>
          </button>
          <button 
            onClick={handleLoadSample}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Load Sample Mission</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-4 rounded-xl bg-green-950/40 border border-green-500/30 text-green-300 text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: RSS selector & manual Ingestion */}
        <div className="space-y-6 lg:col-span-1">
          {/* Release selector */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-saffron" />
              <span>Select Active PIB Release</span>
            </h4>
            
            <div className="space-y-2">
              <label className="block text-xs text-gray-400">Ingested Releases ({releases.length})</label>
              <select 
                value={selectedReleaseId || ''} 
                onChange={(e) => setSelectedReleaseId(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500 appearance-none text-sm"
              >
                {releases.map(r => (
                  <option key={r.id} value={r.id} className="bg-govNavy text-white">{r.title}</option>
                ))}
                {releases.length === 0 && <option>No releases ingested</option>}
              </select>
            </div>

            {selectedReleaseId && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Active Release Preview</span>
                <h5 className="font-bold text-xs line-clamp-2">
                  {releases.find(r => r.id === selectedReleaseId)?.title}
                </h5>
                <p className="text-[11px] text-gray-400 line-clamp-4">
                  {releases.find(r => r.id === selectedReleaseId)?.content}
                </p>
              </div>
            )}
          </div>

          {/* Manual Input Form */}
          <div className="glass-card p-6 rounded-3xl">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Manual Upload & Extract</span>
            </h4>
            <form onSubmit={handleManualIngest} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Release Title</label>
                <input 
                  type="text" 
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Enter release headline"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Content Text</label>
                <textarea 
                  rows={6}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste press release details..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-700 font-sans"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
              >
                Ingest Press Release
              </button>
            </form>
          </div>
        </div>

        {/* Middle Column: Storyboard Script & Timeline Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-tricolorGreen" />
                <span>Script Storyboard Timeline</span>
              </h4>
              
              <div className="flex items-center gap-3">
                <select 
                  value={targetLanguage} 
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Hindi" className="bg-govNavy text-white">हिन्दी (Hindi)</option>
                  <option value="Tamil" className="bg-govNavy text-white">தமிழ் (Tamil)</option>
                  <option value="Telugu" className="bg-govNavy text-white">తెలుగు (Telugu)</option>
                  <option value="Kannada" className="bg-govNavy text-white">ಕನ್ನಡ (Kannada)</option>
                  <option value="Malayalam" className="bg-govNavy text-white">മലയാളം (Malayalam)</option>
                  <option value="Bengali" className="bg-govNavy text-white">বাংলা (Bengali)</option>
                  <option value="Gujarati" className="bg-govNavy text-white">ગુજરાતી (Gujarati)</option>
                  <option value="Marathi" className="bg-govNavy text-white">मराठी (Marathi)</option>
                  <option value="Punjabi" className="bg-govNavy text-white">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="Odia" className="bg-govNavy text-white">ଓଡ଼ିଆ (Odia)</option>
                  <option value="Urdu" className="bg-govNavy text-white">اردو (Urdu)</option>
                  <option value="English" className="bg-govNavy text-white">English</option>
                </select>
                
                <button 
                  onClick={handleScriptRequest}
                  disabled={!selectedReleaseId || loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Build Storyboard</span>
                </button>
              </div>
            </div>

            {/* Scenes Timeline Editor */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {scenes.map((scene, idx) => (
                <div key={scene.id || idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-saffron tracking-widest">Scene #{scene.sceneNum}</span>
                    <button 
                      onClick={() => handleAudioPreview(scene.narration)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                      title="Preview Scene Speech Audio"
                    >
                      <Volume2 className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>
                  
                  <div>
                    <input 
                      type="text"
                      value={scene.headline}
                      onChange={(e) => handleSceneChange(idx, 'headline', e.target.value)}
                      className="w-full bg-transparent font-bold border-b border-transparent hover:border-white/10 focus:border-purple-500 focus:outline-none pb-1 text-sm"
                      placeholder="Scene Headline Title"
                    />
                  </div>

                  <div>
                    <textarea 
                      rows={2}
                      value={scene.narration}
                      onChange={(e) => handleSceneChange(idx, 'narration', e.target.value)}
                      className="w-full bg-transparent text-xs text-gray-300 border border-transparent hover:border-white/10 focus:border-purple-500 focus:outline-none p-1 rounded font-sans"
                      placeholder="Narration Text"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-500 border-t border-white/5 pt-2">
                    <div>
                      <span className="block uppercase tracking-wider font-bold">Image Prompt</span>
                      <span className="text-gray-400 line-clamp-1">{scene.imagePrompt}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wider font-bold">Keywords</span>
                      <span className="text-gray-400">{scene.keywords}</span>
                    </div>
                  </div>
                </div>
              ))}

              {scenes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs">No active script storyboard. Select a release and language, then click "Build Storyboard" to load scenes.</p>
                </div>
              )}
            </div>

            {/* Compile Video action */}
            {scenes.length > 0 && (
              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button 
                  onClick={handleCompileVideo}
                  disabled={compiling}
                  className="px-6 py-3 rounded-xl bg-tricolorGreen hover:bg-tricolorGreen/90 disabled:bg-tricolorGreen/50 text-white font-bold text-xs transition-all flex items-center gap-2"
                >
                  <Film className="w-4 h-4" />
                  <span>Stitch & Compile Video Release</span>
                </button>
              </div>
            )}
          </div>

          {/* Compilation live progress panel */}
          {(compiling || outputVideoUrl) && (
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                <span>Media Compiler Output</span>
              </h4>

              {compiling && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Step: <strong className="text-purple-400">{progressStep}</strong></span>
                    <span className="font-bold text-saffron">{progressPercent}%</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-saffron transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  <p className="text-xs text-gray-300 italic">{progressMessage}</p>
                </div>
              )}

              {outputVideoUrl && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-950/40 border border-green-500/30 text-green-300 text-xs">
                    Video compilation succeeded! View the final broadcast release below.
                  </div>

                  {/* HTML5 video player */}
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black relative">
                    <video 
                      src={outputVideoUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <a 
                      href={outputVideoUrl} 
                      download
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Release MP4</span>
                    </a>
                  </div>

                  {/* Slide preview deck */}
                  <div className="space-y-2">
                    <span className="text-xs text-gray-400 font-bold block">Generated Infographic Slide Cards</span>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {scenes.map((s, idx) => s.imagePath && (
                        <div key={idx} className="w-36 shrink-0 aspect-video rounded-lg overflow-hidden border border-white/5 bg-white/5 relative group">
                          <img src={s.imagePath} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[8px] font-bold">Scene {s.sceneNum}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
