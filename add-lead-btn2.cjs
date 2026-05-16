const fs = require('fs');
let src = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

const addLeadModalStr = `
const AddLeadModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    brandName: '',
    contactName: '',
    contactEmail: '',
    budget: '',
    companyUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.brandName) {
      toast.error("Brand/Channel name is required.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'leads'), {
        brandName: form.brandName,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        budget: Number(form.budget),
        companyUrl: form.companyUrl,
        message: 'Manually added lead.',
        status: 'new',
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success("Lead added!");
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to add lead: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
        <h2 className="text-xl font-bold text-white mb-6 font-headline tracking-tight">Add Lead Manually</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1 block">Brand/Channel Name *</label>
            <input required type="text" value={form.brandName} onChange={e => setForm({...form, brandName: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff0000]" placeholder="MrBeast..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1 block">Contact Name</label>
            <input type="text" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff0000]" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1 block">Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff0000]" placeholder="john@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1 block">Budget ($)</label>
              <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff0000]" placeholder="1000" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1 block">Company URL</label>
              <input type="url" value={form.companyUrl} onChange={e => setForm({...form, companyUrl: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff0000]" placeholder="https://..." />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full mt-4 bg-[#ff0000] hover:bg-[#ff3333] disabled:opacity-50 text-black font-bold uppercase tracking-widest text-xs py-4 rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
            {loading ? 'Adding...' : 'Add Lead'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
`;

if(!src.includes('AddLeadModal =')) {
    src = src.replace('const LeadDetailsModal = ({', addLeadModalStr + '\n\nconst LeadDetailsModal = ({');
    fs.writeFileSync('src/screens/LeadsDashboard.tsx', src);
}
