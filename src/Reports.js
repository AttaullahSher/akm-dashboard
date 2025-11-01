import React, { useMemo, useState } from 'react';
import { Card, Form, Table } from 'react-bootstrap';
import moment from 'moment';

export default function Reports({ records }) {
  const months = useMemo(() => {
    const set = new Set(records.map(r => moment(r.date).format('YYYY-MM')));
    return [...set].sort();
  }, [records]);

  const [filterMonth, setFilterMonth] = useState('');

  const filtered = filterMonth
    ? records.filter(r => moment(r.date).format('YYYY-MM') === filterMonth)
    : records;

  // Grand totals
  const paid = filtered.filter(r => r.type.toLowerCase() === 'invoice' && r.status === 'Paid');
  const unpaid = filtered.filter(r => r.type.toLowerCase() === 'invoice' && r.status === 'Unpaid');

  const grandTotal = paid.reduce((s, r) => s + r.total, 0);
  const pendingTotal = unpaid.reduce((s, r) => s + r.total, 0);
  const pendingNos = unpaid.map(r => r.number).join(', ') || 'None';

  // Monthly sales
  const monthly = months.reduce((obj, m) => {
    const monthPaid = records
      .filter(r => moment(r.date).format('YYYY-MM') === m && r.type.toLowerCase() === 'invoice' && r.status === 'Paid')
      .reduce((s, r) => s + r.total, 0);
    obj[m] = monthPaid;
    return obj;
  }, {});

  // Buyer summary
  const buyers = {};
  records.forEach(r => {
    const name = r.customername || 'Unknown';
    if (!buyers[name]) buyers[name] = { orders: 0, quots: 0, paid: 0 };
    if (r.type.toLowerCase() === 'invoice') {
      buyers[name].orders++;
      if (r.status === 'Paid') buyers[name].paid += r.total;
    } else if (r.type.toLowerCase() === 'quotation') {
      buyers[name].quots++;
    }
  });

  return (
    <Card>
      <Card.Header className="bg-primary text-white">Reports</Card.Header>
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Filter by month</Form.Label>
          <Form.Select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All months</option>
            {months.map(m => <option key={m} value={m}>{moment(m + '-01').format('MMM YYYY')}</option>)}
          </Form.Select>
        </Form.Group>

        <p className="fw-bold">Grand Total (Paid): <span className="text-success">{grandTotal.toFixed(2)}</span></p>
        <p className="fw-bold">Pending: <span className="text-danger">{pendingTotal.toFixed(2)}</span> <br />
          <small>Invoice(s): {pendingNos}</small></p>

        <h6 className="mt-4">Sales per month</h6>
        <Table size="sm" bordered>
          <thead><tr><th>Month</th><th>Sales</th></tr></thead>
          <tbody>
            {Object.entries(monthly).map(([m, s]) => (
              <tr key={m}><td>{moment(m + '-01').format('MMM YYYY')}</td><td>{s.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </Table>

        <h6 className="mt-4">By Customer</h6>
        <Table size="sm" bordered>
          <thead><tr><th>Customer</th><th>Orders</th><th>Quotations</th><th>Paid</th></tr></thead>
          <tbody>
            {Object.entries(buyers).map(([n, v]) => (
              <tr key={n}><td>{n}</td><td>{v.orders}</td><td>{v.quots}</td><td>{v.paid.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}