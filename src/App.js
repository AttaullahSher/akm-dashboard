import React, { useEffect, useState } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import DashboardTable from './DashboardTable';
import Reports from './Reports';
import * as XLSX from 'xlsx';
import moment from 'moment';

const EXCEL_DIRECT_URL = 'https://onedrive.live.com/embed?cid=acde0499edd1a197&resid=EQIN3wXRSR9CnenutlesCSYB1xH3ztgbGQu1ZJcBB8Vtzw&authkey=w5j03f&em=2&wdDownload=1';

function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  // ---------- Load Excel ----------
  useEffect(() => {
    const fetchExcel = async () => {
      try {
        const resp = await fetch(EXCEL_DIRECT_URL);
        if (!resp.ok) throw new Error('Cannot download file');
        const arrayBuffer = await resp.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = wb.Sheets['Records'];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = raw[0].map(h => h.toLowerCase().replace(/\s+/g, ''));
        const rows = raw.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = row[i] ?? '');
          // Parse items JSON
          try { obj.items = JSON.parse(obj.items); } catch { obj.items = []; }
          // Compute total
          obj.total = obj.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
          return obj;
        });

        // Load local overrides (notes + status)
        const saved = JSON.parse(localStorage.getItem('dashboard-overrides') || '{}');
        const merged = rows.map(r => ({
          ...r,
          notes: saved[r.number]?.notes ?? r.notes,
          status: saved[r.number]?.status ?? getInitialStatus(r)
        }));

        // Sort – pending first
        merged.sort((a, b) => (a.status.includes('Un') ? -1 : 1) - (b.status.includes('Un') ? -1 : 1));

        setRecords(merged);
      } catch (e) {
        setWarning(`Failed to load Excel data: ${e.message}. Dashboard will show with empty data.`);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExcel();
  }, []);

  // ---------- Status logic ----------
  const getInitialStatus = (r) => {
    const n = (r.notes || '').toLowerCase();
    const t = (r.type || '').toLowerCase();
    if (t === 'invoice') return n.includes('paid') ? 'Paid' : 'Unpaid';
    if (t === 'quotation') return n.includes('accepted') ? 'Accepted' : 'Unaccepted';
    return n.includes('delivered') ? 'Delivered' : 'Pending';
  };

  const toggleStatus = (num) => {
    setRecords(prev => {
      const updated = prev.map(r => {
        if (r.number !== num) return r;
        const cur = r.status;
        const isPaid = cur === 'Paid';
        const isAcc = cur === 'Accepted';
        const isDel = cur === 'Delivered';

        const newStatus = isPaid ? 'Unpaid' :
                          isAcc ? 'Unaccepted' :
                          isDel ? 'Pending' :
                          (r.type.toLowerCase() === 'invoice' ? 'Paid' :
                           r.type.toLowerCase() === 'quotation' ? 'Accepted' : 'Delivered');

        // Build new notes (append/remove word)
        let note = (r.notes || '').trim();
        const word = newStatus === 'Paid' ? 'Paid' :
                     newStatus === 'Accepted' ? 'Accepted' :
                     newStatus === 'Delivered' ? 'Delivered' : '';

        if (newStatus.includes('Un')) {
          note = note.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim();
        } else if (!note.toLowerCase().includes(word.toLowerCase())) {
          note = note ? `${note} ${word}` : word;
        }

        return { ...r, status: newStatus, notes: note };
      });

      // Save to localStorage
      const saveObj = {};
      updated.forEach(r => { saveObj[r.number] = { notes: r.notes, status: r.status }; });
      localStorage.setItem('dashboard-overrides', JSON.stringify(saveObj));

      // Re-sort
      updated.sort((a, b) => (a.status.includes('Un') ? -1 : 1) - (b.status.includes('Un') ? -1 : 1));
      return updated;
    });
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container>
      <h1>Invoice Dashboard</h1>
      {warning && <Alert variant="warning">{warning}</Alert>}
      <DashboardTable records={records} toggleStatus={toggleStatus} />
      <Reports records={records} />
    </Container>
  );
}

export default App;