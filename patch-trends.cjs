const fs = require('fs');
let code = fs.readFileSync('src/screens/Trends.tsx', 'utf8');

const oldTrendAlg = `  // Calculate advanced metrics
  const avgViews = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.viewCount, 10) || 0), 0) / videos.length : 0;
  const avgLikes = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.likeCount, 10) || 0), 0) / videos.length : 0;
  const avgComments = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.commentCount, 10) || 0), 0) / videos.length : 0;
  const engRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;
  const estSponsorshipVal = (avgViews / 1000) * 20; // assumed $20 CPM 

  return (`;

const newTrendAlg = `  // Calculate advanced metrics (Algorithm System Update)
  const avgViews = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.viewCount, 10) || 0), 0) / videos.length : 0;
  const avgLikes = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.likeCount, 10) || 0), 0) / videos.length : 0;
  const avgComments = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.commentCount, 10) || 0), 0) / videos.length : 0;
  const engRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;
  
  // Algorithmic Revenue Modeling
  const estSponsorshipVal = (avgViews / 1000) * 20; // assumed $20 CPM 
  const estMonthlyAdsense = (avgViews * Math.max(1, videos.length || 4) / 1000) * 3.5; // Monthly Adsense proxy
  const algorithmicRevenueRating = (estSponsorshipVal + estMonthlyAdsense) > 10000 ? "HIGH TIER" : "SCALING";

  return (`;

code = code.replace(oldTrendAlg, newTrendAlg);

const oldTrendUI = `  <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121008] rounded-sm p-6 border border-[#ff0000]/30 flex flex-col justify-between gap-2 relative overflow-hidden shadow-[0_0_20px_rgba(255,0,0,0.05)] text-[#ff0000]">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64}/></div>
                 <div className="flex items-center gap-2 uppercase text-[10px] font-bold tracking-widest relative z-10 opacity-80">Est. 60s Integration</div>
                 <div className="relative z-10">
                   <div className="text-3xl font-black">\${estSponsorshipVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                   <p className="text-[10px] text-[#ff0000]/50 mt-1 leading-tight font-mono tracking-widest">Based on $20 CPM avg</p>
                 </div>
              </div>`;

const newTrendUI = `  <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121008] rounded-sm p-6 border border-[#ff0000]/30 flex flex-col justify-between gap-2 relative overflow-hidden shadow-[0_0_20px_rgba(255,0,0,0.05)] text-[#ff0000]">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64}/></div>
                 <div className="flex items-center gap-2 uppercase text-[10px] font-bold tracking-widest relative z-10 opacity-80">Algorithmic Est. Value</div>
                 <div className="relative z-10">
                   <div className="text-3xl font-black">\${estSponsorshipVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                   <p className="text-[10px] text-[#ff0000]/50 mt-1 leading-tight font-mono tracking-widest">\${algorithmicRevenueRating} / $20 CPM base</p>
                 </div>
              </div>`;

code = code.replace(oldTrendUI, newTrendUI);

fs.writeFileSync('src/screens/Trends.tsx', code);
console.log("Patched trends");
