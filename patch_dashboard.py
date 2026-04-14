import re

with open(r'd:\tabungan-apps\frontend\src\pages\Dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """             {categories.map(cat => {
               const bal = getEnvelopeBalance(cat._id);
               return (
                 <div key={cat._id} className="flex flex-col items-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <button onClick={() => promptDeleteCategory(cat._id, cat.name)} className="absolute top-2 right-2 text-rose-300 hover:text-rose-600 transition-colors p-1" title="Reset/Hapus Budget ini">
                      <X size={15} />
                    </button>
                    <p className="text-3xl mb-1 mt-2 group-hover:scale-110 transition-transform">{cat.icon}</p>
                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-1">{cat.name}</p>
                    <h4 className="font-extrabold text-xl text-gray-800 tracking-tight mt-1 mb-auto">Rp {bal.toLocaleString('id-ID')}</h4>
                    
                    <div className="w-full mt-4 flex gap-1.5 pt-3 border-t border-indigo-50/50">
                       <button onClick={() => openTransactionModal('allocation', 'gaji', cat._id)} className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-colors">
                          <ArrowDownToLine size={14} className="mb-0.5" /> Sedot Gaji
                       </button>
                       <button onClick={() => openTransactionModal('withdrawal', cat._id)} className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 py-1.5 rounded-lg transition-colors">
                          <ArrowUpFromLine size={14} className="mb-0.5" /> Pakai
                       </button>
                    </div>
                 </div>
               );
             })}"""

new_block = """             {categories.map(cat => {
               const bal = getEnvelopeBalance(cat._id);
               const totalCatBalance = categories.reduce((sum, c) => sum + Math.max(getEnvelopeBalance(c._id), 0), 0);
               const pct = totalCatBalance > 0 ? Math.max(bal, 0) / totalCatBalance : 0;
               const circumference = 2 * Math.PI * 28;
               const dash = pct * circumference;
               const gap = circumference - dash;
               return (
                 <div key={cat._id} className="flex flex-col items-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <button onClick={() => promptDeleteCategory(cat._id, cat.name)} className="absolute top-2 right-2 text-rose-300 hover:text-rose-600 transition-colors p-1" title="Reset/Hapus Budget ini">
                      <X size={15} />
                    </button>

                    {/* Donut Chart */}
                    <div className="relative flex items-center justify-center my-2">
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="28" fill="none" stroke="#e0e7ff" strokeWidth="8" />
                        <circle
                          cx="36" cy="36" r="28" fill="none"
                          stroke={bal <= 0 ? '#fca5a5' : '#818cf8'}
                          strokeWidth="8"
                          strokeDasharray={`${dash} ${gap}`}
                          strokeLinecap="round"
                          transform="rotate(-90 36 36)"
                          style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                      </svg>
                      <span className="absolute text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    </div>

                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{cat.name}</p>
                    <h4 className={`font-extrabold text-xl tracking-tight mt-1 ${bal < 0 ? 'text-rose-500' : 'text-gray-800'}`}>
                      Rp {bal.toLocaleString('id-ID')}
                    </h4>
                    <p className="text-[10px] text-indigo-400 font-semibold mt-0.5 mb-1">
                      {totalCatBalance > 0 ? `${Math.round(pct * 100)}% dari total` : '\u2014'}
                    </p>
                    
                    <div className="w-full mt-2 flex gap-1.5 pt-3 border-t border-indigo-50/50">
                       <button onClick={() => openTransactionModal('allocation', 'gaji', cat._id)} className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-colors">
                          <ArrowDownToLine size={14} className="mb-0.5" /> Sedot Gaji
                       </button>
                       <button onClick={() => openTransactionModal('withdrawal', cat._id)} className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 py-1.5 rounded-lg transition-colors">
                          <ArrowUpFromLine size={14} className="mb-0.5" /> Pakai
                       </button>
                    </div>
                 </div>
               );
             })}"""

# Normalize line endings for comparison
content_normalized = content.replace('\r\n', '\n')
old_normalized = old_block.replace('\r\n', '\n')
new_normalized = new_block.replace('\r\n', '\n')

if old_normalized in content_normalized:
    result = content_normalized.replace(old_normalized, new_normalized, 1)
    with open(r'd:\tabungan-apps\frontend\src\pages\Dashboard.jsx', 'w', encoding='utf-8', newline='\n') as f:
        f.write(result)
    print("SUCCESS: Replacement done")
else:
    print("ERROR: Target block not found")
    # Debug: find where categories.map starts
    idx = content_normalized.find('categories.map(cat =>')
    print(f"categories.map found at index: {idx}")
    print(repr(content_normalized[idx:idx+200]))
