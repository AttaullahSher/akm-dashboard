import React from 'react';
import { Table, Button, ListGroup } from 'react-bootstrap';
import moment from 'moment';

export default function DashboardTable({ records, toggleStatus }) {
  return (
    <Table striped bordered hover responsive size="sm" className="table">
      <thead className="table-primary">
        <tr>
          <th>#</th>
          <th>Type</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Notes</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r, i) => (
          <tr key={r.number} style={{ backgroundColor: r.status.includes('Un') ? '#fff3cd' : 'white' }}>
            <td>{i + 1}</td>
            <td>{r.type}</td>
            <td>{moment(r.date).format('DD MMM YYYY')}</td>
            <td>{r.customername}</td>
            <td>
              <ListGroup variant="flush">
                {r.items.map((it, idx) => (
                  <ListGroup.Item key={idx} className="py-1">
                    {it.model} – {it.description} ×{it.qty} @ {it.price}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </td>
            <td className="text-end fw-bold">{r.total.toFixed(2)}</td>
            <td>{r.notes}</td>
            <td>
              <span className={`badge ${r.status.includes('Un') ? 'bg-warning' : 'bg-success'}`}>
                {r.status}
              </span>
            </td>
            <td>
              <Button size="sm" variant={r.status.includes('Un') ? 'outline-success' : 'outline-warning'}
                      onClick={() => toggleStatus(r.number)}>
                {r.status.includes('Un') ? 'Mark Done' : 'Undo'}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}